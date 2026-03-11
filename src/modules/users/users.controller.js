import * as usersService from './users.service.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await usersService.getAllUsers();
        // Mapear los datos para limpiar cosas sensibles como password_hash si estuviera incluido
        const safeUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            phone: u.phone,
            created_at: u.created_at,
            role: {
                id: u.role.id,
                name: u.role.name
            },
            pendingRequest: u.role_requests.length > 0 ? u.role_requests[0] : null
        }));
        res.json({ success: true, data: safeUsers });
    } catch (error) {
        next(error);
    }
};

export const requestWholesalerRole = async (req, res, next) => {
    try {
        const userId = req.user.id; // Del token JWT
        const request = await usersService.requestRoleUpgrade(userId, 'Wholesaler');
        res.status(201).json({ success: true, data: request, message: 'Solicitud enviada correctamente.' });
    } catch (error) {
        // Enviar bad request si es de negocio
        res.status(400).json({ success: false, message: error.message });
    }
};

export const handleRoleRequest = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approved' o 'rejected'
        const updatedRequest = await usersService.handleRoleRequest(id, action);
        res.json({ success: true, data: updatedRequest, message: `Solicitud ${action === 'approved' ? 'aprobada' : 'rechazada'}.` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateUserRoleManually = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role_id } = req.body;
        const updatedUser = await usersService.updateUserRole(id, role_id);
        res.json({ success: true, data: updatedUser, message: 'Rol actualizado exitosamente.' });
    } catch (error) {
        next(error);
    }
};

export const getRoles = async (req, res, next) => {
    try {
        const roles = await usersService.getRoles();
        res.json({ success: true, data: roles });
    } catch (error) {
        next(error);
    }
};
