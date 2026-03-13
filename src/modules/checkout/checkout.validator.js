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
    shipping_details: z.object({
        address_line: z.string().min(5, { message: 'La dirección es demasiado corta.' }),
        city: z.string().min(2, { message: 'La ciudad es requerida.' }),
        state: z.string().min(2, { message: 'La provincia/estado es requerida.' }),
        postal_code: z.string().min(4, { message: 'El código postal es inválido.' }),
        shipping_type: z.enum(['standard', 'express']).default('standard'),
    })
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
