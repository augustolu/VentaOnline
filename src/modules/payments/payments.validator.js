import { z } from 'zod';

// ---------------------------------------------------------------------------
// upload-receipt: order_id llega como campo de texto en el multipart/form-data
// ---------------------------------------------------------------------------
const uploadReceiptSchema = z.object({
    order_id: z.string().uuid({ message: 'order_id debe ser un UUID válido.' }),
    transfer_reference: z.string().max(255).optional(),
    amount: z
        .string({ required_error: 'amount es requerido.' })
        .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
            message: 'amount debe ser un número positivo.',
        })
        .transform(parseFloat),
});

/**
 * Valida el body de POST /api/payments/upload-receipt.
 * Los campos llegan como strings en multipart/form-data.
 */
export const validateUploadReceipt = (req, res, next) => {
    const result = uploadReceiptSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Payload inválido.',
            errors: result.error.flatten().fieldErrors,
        });
    }
    req.body = result.data;
    next();
};

// ---------------------------------------------------------------------------
// verify: solo recibe order_id
// ---------------------------------------------------------------------------
const verifySchema = z.object({
    order_id: z.string().uuid({ message: 'order_id debe ser un UUID válido.' }),
});

/**
 * Valida el body de POST /api/payments/verify.
 */
export const validateVerify = (req, res, next) => {
    const result = verifySchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Payload inválido.',
            errors: result.error.flatten().fieldErrors,
        });
    }
    req.body = result.data;
    next();
};
