import * as ordersService from './orders.service.js';

export async function getOrders(req, res) {
    try {
        const { id: userId, role } = req.user;
        const { status } = req.query;

        const orders = await ordersService.listOrders({ userId, role, status });

        res.json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('[OrdersController] Error in getOrders:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las órdenes.',
        });
    }
}

export async function rejectOrder(req, res) {
    try {
        const { id: verifierUserId } = req.user;
        const { orderId } = req.body;
        const { reason } = req.body;

        if (!orderId) {
            return res.status(400).json({ success: false, message: 'ID de orden requerido.' });
        }

        const result = await ordersService.rejectOrder({
            verifierUserId,
            orderId,
            reason: reason || 'Rechazado por el administrador.',
        });

        res.json({
            success: true,
            message: 'Orden rechazada correctamente y stock restaurado.',
            data: result,
        });
    } catch (error) {
        console.error('[OrdersController] Error in rejectOrder:', error);
        const status = error.message.includes('No se puede') ? 409 : 500;
        res.status(status).json({
            success: false,
            message: error.message || 'Error al rechazar la orden.',
        });
    }
}
