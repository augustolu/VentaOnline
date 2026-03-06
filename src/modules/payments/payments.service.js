import { prisma } from '../../lib/prisma.js';
import { PaymentError } from './payments.errors.js';
import { buildReceiptUrl } from './payments.multer.js';

// ---------------------------------------------------------------------------
// CONSTANTES DE NEGOCIO
// ---------------------------------------------------------------------------
const ALLOWED_VERIFIER_ROLES = new Set(['Admin', 'Employee']);

// ---------------------------------------------------------------------------
// HELPER: registro de auditoría
// ---------------------------------------------------------------------------

/**
 * Inserta un registro en audit_logs dentro de la transacción provista.
 *
 * @param {object} tx         - Prisma transaction client.
 * @param {object} logData
 * @param {string} logData.userId     - ID del empleado/admin que realiza la acción.
 * @param {string} logData.action     - Ej: 'VERIFY_PAYMENT'.
 * @param {string} logData.tableName  - Tabla afectada.
 * @param {string} logData.recordId   - ID del registro afectado.
 * @param {object} [logData.oldData]  - Estado anterior.
 * @param {object} [logData.newData]  - Estado nuevo.
 */
async function writeAuditLog(tx, { userId, action, tableName, recordId, oldData, newData }) {
    await tx.auditLog.create({
        data: {
            user_id: userId,
            action,
            table_name: tableName,
            record_id: recordId,
            old_data: oldData ?? undefined,
            new_data: newData ?? undefined,
        },
    });
}

// ---------------------------------------------------------------------------
// SERVICE 1: upload-receipt
// ---------------------------------------------------------------------------

/**
 * Procesa la subida del comprobante de transferencia.
 *
 * Flujo (ACID):
 *  1. Valida que la orden exista, pertenezca al usuario y esté en estado 'Pending'.
 *  2. Verifica que no exista ya un pago registrado para esa orden.
 *  3. Dentro de la transacción:
 *     a. Crea el registro en `payments`.
 *     b. Crea el registro en `payment_receipts` con la URL del archivo.
 *     c. Actualiza el estado de `orders` a 'Awaiting_Verification'.
 *
 * @param {object} params
 * @param {string} params.userId             - ID del usuario autenticado (dueño de la orden).
 * @param {string} params.orderId            - ID de la orden a pagar.
 * @param {number} params.amount             - Monto de la transferencia declarada.
 * @param {string} [params.transferReference]- Referencia bancaria opcional.
 * @param {import('multer').File} params.file - Archivo subido por Multer.
 *
 * @returns {Promise<{ payment_id: string, receipt_url: string, order_status: string }>}
 * @throws {PaymentError}
 */
export async function uploadReceipt({ userId, orderId, amount, transferReference, file }) {
    // ─── 1. Validar la orden ──────────────────────────────────────────────────
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, user_id: true, status: true, total_amount: true, payment: { select: { id: true } } },
    });

    if (!order) {
        throw new PaymentError('Orden no encontrada.', 404);
    }

    if (order.user_id !== userId) {
        throw new PaymentError('No tienes permiso para pagar esta orden.', 403);
    }

    if (order.status !== 'Pending') {
        throw new PaymentError(
            `La orden ya no acepta pagos. Estado actual: ${order.status}.`,
            409
        );
    }

    if (order.payment) {
        throw new PaymentError('Esta orden ya tiene un pago registrado.', 409);
    }

    // ─── 2. Construir URL del comprobante ─────────────────────────────────────
    const receiptUrl = buildReceiptUrl(file);

    // ─── 3. Transacción ACID ──────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
        // 3a. Crear el pago
        const payment = await tx.payment.create({
            data: {
                order_id: orderId,
                amount,
                transfer_reference: transferReference ?? null,
                transaction_date: new Date(),
            },
        });

        // 3b. Guardar la URL del comprobante
        const receipt = await tx.paymentReceipt.create({
            data: {
                payment_id: payment.id,
                receipt_url: receiptUrl,
            },
        });

        // 3c. Actualizar estado de la orden
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: 'Awaiting_Verification' },
        });

        return { payment, receipt, order: updatedOrder };
    });

    return {
        payment_id: result.payment.id,
        receipt_url: result.receipt.receipt_url,
        order_status: result.order.status,
    };
}

// ---------------------------------------------------------------------------
// SERVICE 2: verify-payment
// ---------------------------------------------------------------------------

/**
 * Verifica un pago y marca la orden como 'Paid'.
 * Solo accesible para roles Admin o Employee.
 *
 * Flujo (ACID):
 *  1. Verifica que el empleado exista y tenga el rol correcto.
 *  2. Verifica que la orden esté en 'Awaiting_Verification' y tenga pago.
 *  3. Dentro de la transacción:
 *     a. Actualiza el estado de `orders` a 'Paid'.
 *     b. Escribe el registro en `audit_logs` con los datos del antes y después.
 *
 * @param {object} params
 * @param {string} params.verifierUserId - ID del empleado/admin que verifica.
 * @param {string} params.orderId        - ID de la orden a verificar.
 *
 * @returns {Promise<{ order_id: string, new_status: string, audit_log_id: string }>}
 * @throws {PaymentError}
 */
export async function verifyPayment({ verifierUserId, orderId }) {
    // ─── 1. Validar el rol del verificador ───────────────────────────────────
    const verifier = await prisma.user.findUnique({
        where: { id: verifierUserId },
        select: { id: true, role: { select: { name: true } } },
    });

    if (!verifier) {
        throw new PaymentError('Usuario verificador no encontrado.', 404);
    }

    if (!ALLOWED_VERIFIER_ROLES.has(verifier.role.name)) {
        throw new PaymentError(
            'No tienes permisos para verificar pagos. Se requiere rol Admin o Employee.',
            403
        );
    }

    // ─── 2. Validar la orden ──────────────────────────────────────────────────
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            id: true,
            status: true,
            total_amount: true,
            payment: { select: { id: true, amount: true } },
        },
    });

    if (!order) {
        throw new PaymentError('Orden no encontrada.', 404);
    }

    if (order.status !== 'Awaiting_Verification') {
        throw new PaymentError(
            `La orden no está pendiente de verificación. Estado actual: ${order.status}.`,
            409
        );
    }

    if (!order.payment) {
        throw new PaymentError('La orden no tiene un pago registrado para verificar.', 400);
    }

    // ─── 3. Transacción ACID ──────────────────────────────────────────────────
    const previousStatus = order.status;

    const result = await prisma.$transaction(async (tx) => {
        // 3a. Actualizar estado de la orden
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: 'Paid' },
        });

        // 3b. Audit log obligatorio
        await writeAuditLog(tx, {
            userId: verifierUserId,
            action: 'VERIFY_PAYMENT',
            tableName: 'orders',
            recordId: orderId,
            oldData: { status: previousStatus, total_amount: Number(order.total_amount) },
            newData: { status: updatedOrder.status, total_amount: Number(order.total_amount) },
        });

        // Recuperar el audit log recién creado para devolver su ID
        const auditEntry = await tx.auditLog.findFirst({
            where: { record_id: orderId, action: 'VERIFY_PAYMENT' },
            orderBy: { created_at: 'desc' },
            select: { id: true },
        });

        return { updatedOrder, auditEntry };
    });

    return {
        order_id: result.updatedOrder.id,
        new_status: result.updatedOrder.status,
        audit_log_id: result.auditEntry?.id ?? null,
    };
}
