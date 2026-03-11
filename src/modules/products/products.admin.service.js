import { prisma } from '../../lib/prisma.js';
import { ProductError, getProductById } from './products.service.js';

export async function deleteProduct(id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ProductError('Producto no encontrado.', 404);

    // Prisma Cascade se encarga de borrar existencias de stock asociadas
    await prisma.product.delete({ where: { id } });
    return { success: true, message: 'Producto borrado exitosamente.' };
}

export async function updateProduct(id, data) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ProductError('Producto no encontrado.', 404);

    const {
        category,
        brand,
        model,
        compatibility,
        price,
        image_url,
        description,
        features,
        wholesale_price,
        wholesale_min_quantity
    } = data;

    const updatedProduct = await prisma.$transaction(async (tx) => {
        // Actualizamos datos básicos del producto
        const updated = await tx.product.update({
            where: { id },
            data: {
                category,
                brand,
                model,
                compatibility,
                price: price !== undefined ? Number(price) : undefined,
                image_url,
                description,
                features
            }
        });

        // Actualizamos precio mayorista si se proporcionó
        if (wholesale_price !== undefined) {
            await tx.wholesalePrice.upsert({
                where: { product_id: id },
                update: { price: Number(wholesale_price), min_quantity: wholesale_min_quantity || 5 },
                create: { product_id: id, price: Number(wholesale_price), min_quantity: wholesale_min_quantity || 5 }
            });
        }

        return updated;
    });

    return updatedProduct;
}

export async function updateProductStock(id, { stock_online, stock_physical }) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ProductError('Producto no encontrado.', 404);

    const updateOperations = [];

    if (stock_online !== undefined) {
        if (stock_online < 0) throw new ProductError('El stock online no puede ser negativo.', 400);
        updateOperations.push(
            prisma.stockOnline.upsert({
                where: { product_id: id },
                update: { quantity: stock_online },
                create: { product_id: id, quantity: stock_online }
            })
        );
    }

    if (stock_physical !== undefined) {
        if (stock_physical < 0) throw new ProductError('El stock físico no puede ser negativo.', 400);
        updateOperations.push(
            prisma.stockPhysical.upsert({
                where: { product_id: id },
                update: { quantity: stock_physical },
                create: { product_id: id, quantity: stock_physical }
            })
        );
    }

    await prisma.$transaction(updateOperations);

    // Devolvemos el producto actualizado
    return await getProductById(id);
}

export async function registerPhysicalSale(id, { quantity, payment_method }, user_id) {
    // 1. Obtenemos el producto y su stock físico actual
    const product = await prisma.product.findUnique({
        where: { id },
        include: { stock_physical: true }
    });

    if (!product) throw new ProductError('Producto no encontrado.', 404);
    if (!product.stock_physical || product.stock_physical.quantity < quantity) {
        throw new ProductError('Stock físico insuficiente para procesar esta venta.', 400);
    }

    // El monto total de la venta es precio (numérico) * cantidad
    const total_amount = Number(product.price) * quantity;

    // 2. Realizamos la transacción atómica
    const saleResult = await prisma.$transaction(async (tx) => {
        // Reducir stock físico
        const updatedStock = await tx.stockPhysical.update({
            where: { product_id: id },
            data: { quantity: { decrement: quantity } }
        });

        // Registrar la Venta
        const sale = await tx.sale.create({
            data: {
                product_id: id,
                user_id: user_id, // Empleado que validó
                quantity: quantity,
                total_amount: total_amount,
                payment_method: payment_method || "Efectivo",
            }
        });

        return { sale, updatedStock };
    });

    return saleResult;
}

export async function bulkDeleteProducts(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new ProductError('No se proporcionaron IDs para eliminar.');
    }

    // Prisma cascade borrará el stock y precios mayoristas
    await prisma.product.deleteMany({
        where: { id: { in: ids } }
    });

    return { success: true, message: `${ids.length} productos eliminados exitosamente.` };
}

export async function bulkUpdatePrice(ids, { type, value }) {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new ProductError('No se proporcionaron IDs para actualizar.');
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
        throw new ProductError('El valor proporcionado no es un número válido.');
    }

    return await prisma.$transaction(async (tx) => {
        const products = await tx.product.findMany({
            where: { id: { in: ids } },
            select: { id: true, price: true }
        });

        const updates = products.map(product => {
            let newPrice = product.price;

            if (type === 'fixed') {
                newPrice = numValue;
            } else if (type === 'percentage') {
                newPrice = Number(product.price) * (1 + numValue / 100);
            } else if (type === 'amount') {
                newPrice = Number(product.price) + numValue;
            }

            if (newPrice < 0) newPrice = 0;

            return tx.product.update({
                where: { id: product.id },
                data: { price: newPrice }
            });
        });

        await Promise.all(updates);
        return { success: true, message: `${ids.length} productos actualizados exitosamente.` };
    });
}
