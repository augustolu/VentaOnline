export async function deleteProduct(id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new ProductError('Producto no encontrado.', 404);

    // Prisma Cascade se encarga de borrar existencias de stock asociadas
    await prisma.product.delete({ where: { id } });
    return { success: true, message: 'Producto borrado exitosamente.' };
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
