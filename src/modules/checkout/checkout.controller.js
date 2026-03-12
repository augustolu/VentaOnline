import { processCheckout, releaseExpiredOrdersStock } from './checkout.service.js';
import { CheckoutError } from './checkout.errors.js';

/**
 * POST /api/checkout
 *
 * Body esperado (ya validado por checkout.validator.js):
 * {
 *   "items": [
 *     { "product_id": "uuid", "quantity": 2 }
 *   ]
 * }
 *
 * Respuesta exitosa (201):
 * {
 *   "success": true,
 *   "data": {
 *     "order_id":     "uuid",
 *     "status":       "Pending",
 *     "total_amount": 199.98,
 *     "items_count":  2
 *   }
 * }
 */
export const checkoutController = async (req, res) => {
    try {
        const userId = req.user?.id || null;      // inyectado por optionalAuthenticate
        const { items } = req.body;         // validado y normalizado por validateCheckout

        const result = await processCheckout(userId, items);

        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        // ── Error de negocio controlado (stock, usuario no encontrado, etc.) ──
        if (error instanceof CheckoutError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        // ── Error inesperado → log interno + respuesta genérica al cliente ──
        console.error('[CheckoutController] Error inesperado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor. Por favor intenta más tarde.',
        });
    }
};

/**
 * POST /api/checkout/cleanup
 * Libera el stock de órdenes expiradas manualmente.
 * Se llama desde el frontend cuando detecta que el timer llegó a cero.
 */
export const cleanupController = async (req, res) => {
    try {
        const { order_id } = req.body;
        const result = await releaseExpiredOrdersStock(order_id);
        return res.status(200).json({
            success: true,
            message: 'Limpieza de stock completada.',
            released_count: result.released
        });
    } catch (error) {
        console.error('[CheckoutController] Error en cleanup:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al procesar la limpieza de stock.',
        });
    }
};
