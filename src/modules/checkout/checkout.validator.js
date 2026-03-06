import { z } from 'zod';

const checkoutSchema = z.object({
    items: z
        .array(
            z.object({
                product_id: z.string().uuid({ message: 'product_id debe ser un UUID válido.' }),
                quantity: z.number().int().positive({ message: 'La cantidad debe ser un entero positivo.' }),
            })
        )
        .min(1, { message: 'El carrito no puede estar vacío.' }),
});

/**
 * Middleware de validación del body para POST /api/checkout.
 * Rechaza la petición antes de llegar al controlador si el payload es inválido.
 */
export const validateCheckout = (req, res, next) => {
    const result = checkoutSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: 'Payload inválido.',
            errors: result.error.flatten().fieldErrors,
        });
    }
    req.body = result.data; // datos normalizados
    next();
};
