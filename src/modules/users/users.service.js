import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Obtener todos los usuarios ordenados por prioridad
export const getAllUsers = async () => {
    const users = await prisma.user.findMany({
        include: {
            role: true,
            role_requests: {
                where: { status: 'pending' },
                include: { role: true }
            }
        },
        orderBy: { created_at: 'desc' }
    });

    // Ordenar en memoria por prioridad:
    // 1. Con solicitud Mayorista pendiente
    // 2. Empleados
    // 3. Mayoristas
    // 4. Clientes
    return users.sort((a, b) => {
        const aHasRequest = a.role_requests.length > 0;
        const bHasRequest = b.role_requests.length > 0;

        if (aHasRequest && !bHasRequest) return -1;
        if (!aHasRequest && bHasRequest) return 1;

        const rolePriority = { 'Admin': 0, 'Employee': 1, 'Wholesaler': 2, 'Client': 3 };
        const priorityA = rolePriority[a.role.name] ?? 99;
        const priorityB = rolePriority[b.role.name] ?? 99;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        return 0; // Mantener orden original (fecha) si misma prioridad
    });
};

// 2. Solicitar rol Mayorista
export const requestRoleUpgrade = async (userId, roleName) => {
    // Buscar el rol solicitado (Mayorista)
    const targetRole = await prisma.role.findFirst({ where: { name: roleName } });
    if (!targetRole) throw new Error(`Rol ${roleName} no encontrado.`);

    // Verificar si ya tiene el rol
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (user.role.name === roleName || user.role.name === 'Admin') {
        throw new Error(`El usuario ya tiene permisos equivalentes o superiores a ${roleName}.`);
    }

    // Upsert solicitud (crea nueva o actualiza rechazada a pendiente)
    // Prisma maneja la restricción @@unique en [user_id, requested_role_id, status]
    const existingPending = await prisma.roleRequest.findFirst({
        where: { user_id: userId, requested_role_id: targetRole.id, status: 'pending' }
    });

    if (existingPending) {
        throw new Error('Ya tienes una solicitud pendiente para este rol.');
    }

    return await prisma.roleRequest.create({
        data: {
            user_id: userId,
            requested_role_id: targetRole.id,
            status: 'pending'
        }
    });
};

// 3. Procesar solicitud de rol (Aprobar / Rechazar)
export const handleRoleRequest = async (requestId, action) => {
    if (!['approved', 'rejected'].includes(action)) {
        throw new Error('Acción inválida. Use "approved" o "rejected".');
    }

    const request = await prisma.roleRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new Error('Solicitud no encontrada.');
    if (request.status !== 'pending') throw new Error('La solicitud ya fue procesada.');

    return await prisma.$transaction(async (tx) => {
        const updatedRequest = await tx.roleRequest.update({
            where: { id: requestId },
            data: { status: action, updated_at: new Date() }
        });

        if (action === 'approved') {
            await tx.user.update({
                where: { id: request.user_id },
                data: { role_id: request.requested_role_id }
            });
        }

        return updatedRequest;
    });
};

// 4. Actualizar rol manualmente
export const updateUserRole = async (userId, newRoleId) => {
    return await prisma.user.update({
        where: { id: userId },
        data: { role_id: newRoleId },
        include: { role: true }
    });
};

export const getRoles = async () => {
    return await prisma.role.findMany();
};
