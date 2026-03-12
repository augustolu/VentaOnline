import { prisma } from '../../lib/prisma.js';

/**
 * List orders with filters and eager loading.
 */
export async function listOrders({ userId, role, status }) {
    const where = {};

    // Clients only see their own orders
    if (role === 'Client' || role === 'Wholesaler') {
        where.user_id = userId;
    }

    // Optional status filter
    if (status) {
        where.status = status;
    }

    return await prisma.order.findMany({
        where,
        include: {
            user: {
                select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                },
            },
            order_items: {
                include: {
                    product: {
                        select: {
                            brand: true,
                            model: true,
                            image_url: true,
                        },
                    },
                },
            },
            payment: {
                include: {
                    payment_receipt: true,
                },
            },
        },
        orderBy: {
            created_at: 'desc',
        },
    });
}

/**
 * Rejects an order and restores stock.
 */
export async function rejectOrder({ verifierUserId, orderId, reason }) {
    // 1. Verify order exists and is in a state that can be rejected
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { order_items: true },
    });

    if (!order) {
        throw new Error('Orden no encontrada.');
    }

    if (['Paid', 'Rejected'].includes(order.status)) {
        throw new Error(`No se puede rechazar una orden en estado ${order.status}.`);
    }

    const previousStatus = order.status;

    // 2. Transaction ACID
    return await prisma.$transaction(async (tx) => {
        // a. Update order status
        const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: { status: 'Rejected' },
        });

        // b. Restore stock in stock_online
        for (const item of order.order_items) {
            await tx.stockOnline.update({
                where: { product_id: item.product_id },
                data: { quantity: { increment: item.quantity } },
            });
        }

        // c. Audit Log
        await tx.auditLog.create({
            data: {
                user_id: verifierUserId,
                action: 'REJECT_ORDER',
                table_name: 'orders',
                record_id: orderId,
                old_data: { status: previousStatus, reason },
                new_data: { status: 'Rejected' },
            },
        });

        return updatedOrder;
    });
}
