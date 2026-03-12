import multer from 'multer';
import { uploadReceipt, verifyPayment } from './payments.service.js';
import { PaymentError } from './payments.errors.js';

// ---------------------------------------------------------------------------
// HELPER — manejo uniforme de errores de negocio y Multer
// ---------------------------------------------------------------------------
function handleError(res, error) {
    if (error instanceof PaymentError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    // Multer arroja MulterError para archivos inválidos (tamaño, tipo, etc.)
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Error al subir archivo: ${error.message}` });
    }

    console.error('[PaymentsController] Error inesperado:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
}

// ---------------------------------------------------------------------------
// CONTROLADOR 1: POST /api/payments/upload-receipt
// ---------------------------------------------------------------------------

/**
 * Recibe el comprobante de transferencia junto con order_id, amount
 * y reference opcional.
 *
 * Content-Type: multipart/form-data
 * Campos:
 *   - receipt      (file)   — imagen JPG/PNG o PDF, máx 5 MB
 *   - order_id     (string) — UUID de la orden
 *   - amount       (number) — monto declarado de la transferencia
 *   - transfer_reference (string, opcional) — referencia/código bancario
 *
 * Respuesta 201:
 * {
 *   "success": true,
 *   "data": {
 *     "payment_id":   "uuid",
 *     "receipt_url":  "https://...",
 *     "order_status": "Awaiting_Verification"
 *   }
 * }
 */
export const uploadReceiptController = async (req, res) => {
    try {
        // req.file  → inyectado por Multer (ver routes)
        // req.body  → validado y normalizado por validateUploadReceipt
        // req.user  → inyectado por authenticate middleware
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'El comprobante de pago es requerido (campo "receipt").',
            });
        }

        const result = await uploadReceipt({
            userId: req.user?.id || null,
            orderId: req.body.order_id,
            amount: req.body.amount,
            transferReference: req.body.transfer_reference,
            file: req.file,
        });

        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return handleError(res, error);
    }
};

// ---------------------------------------------------------------------------
// CONTROLADOR 2: POST /api/payments/verify
// ---------------------------------------------------------------------------

/**
 * Marca una orden como 'Paid' y registra la acción en audit_logs.
 * Solo accesible para Admin/Employee (validación en el servicio y en el middleware).
 *
 * Body: { "order_id": "uuid" }
 *
 * Respuesta 200:
 * {
 *   "success": true,
 *   "data": {
 *     "order_id":     "uuid",
 *     "new_status":   "Paid",
 *     "audit_log_id": "uuid"
 *   }
 * }
 */
export const verifyPaymentController = async (req, res) => {
    try {
        const result = await verifyPayment({
            verifierUserId: req.user.id,
            orderId: req.body.order_id,
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return handleError(res, error);
    }
};
