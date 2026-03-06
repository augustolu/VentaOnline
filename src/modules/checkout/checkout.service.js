import { prisma } from '../../lib/prisma.js';
import { CheckoutError } from './checkout.errors.js';

// ---------------------------------------------------------------------------
// TIPOS DE DOMINIO (JSDoc para autocompletado sin TS)
// ---------------------------------------------------------------------------
/**
 * @typedef {{ product_id: string, quantity: number }} CartItem
 * @typedef {{ order_id: string, status: string, total_amount: number, items_count: number }} CheckoutResult
 */

// ---------------------------------------------------------------------------
// HELPERS INTERNOS
// ---------------------------------------------------------------------------

/**
 * Resuelve el precio unitario para un ítem del carrito.
 * Si el usuario es Wholesaler y cumple la cantidad mínima ⟹ precio mayorista.
 * En cualquier otro caso ⟹ precio normal del producto.
 *
 * @param {object} product        - Fila de `products` con `wholesale_price`.
 * @param {number} quantity       - Cantidad solicitada en el carrito.
 * @param {boolean} isWholesaler  - Si el usuario tiene rol Wholesaler.
 * @returns {number} Precio unitario resuelto.
 */
function resolveUnitPrice(product, quantity, isWholesaler) {
    const wp = product.wholesale_price;
    if (isWholesaler && wp && quantity >= wp.min_quantity) {
        return Number(wp.price);
    }
    return Number(product.price);
}

// ---------------------------------------------------------------------------
// SERVICIO PRINCIPAL
// ---------------------------------------------------------------------------

/**
 * Procesa el checkout completo de forma ACID en una única transacción Prisma.
 *
 * Flujo:
 *  1. Consulta el rol del usuario (detecta Wholesaler).
 *  2. Obtiene productos + stock_online + wholesale_price en una sola query.
 *  3. Valida stock suficiente para TODOS los ítems antes de escribir nada.
 *  4. Dentro de la transacción:
 *     a. Re-verifica stock con SELECT ... FOR UPDATE equivalente (Prisma serializable).
 *     b. Crea la Order con estado Pending.
 *     c. Inserta los OrderItems con el precio resuelto.
 *     d. Descuenta el stock en stock_online.
 *  5. Si cualquier paso falla → ROLLBACK automático.
 *
 * @param {string}     userId    - ID del usuario autenticado.
 * @param {CartItem[]} cartItems - Items del carrito.
 * @returns {Promise<CheckoutResult>}
 * @throws {CheckoutError} si hay problema de stock o negocio.
 */
export async function processCheckout(userId, cartItems) {
    // ─── 1. Verificar que el usuario existe y cargar su rol ───────────────────
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: { select: { name: true } } },
    });

    if (!user) throw new CheckoutError('Usuario no encontrado.', 404);

    const isWholesaler = user.role.name === 'Wholesaler';

    // ─── 2. Cargar productos con stock online y precio mayorista ─────────────
    const productIds = cartItems.map((i) => i.product_id);

    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            brand: true,
            model: true,
            price: true,
            stock_online: { select: { quantity: true } },
            wholesale_price: { select: { price: true, min_quantity: true } },
        },
    });

    // ─── 3. Validaciones PRE-transacción ─────────────────────────────────────

    // 3a. Detectar productos que no existen en el catálogo
    if (products.length !== productIds.length) {
        const foundIds = new Set(products.map((p) => p.id));
        const missingIds = productIds.filter((id) => !foundIds.has(id));
        throw new CheckoutError(
            `Productos no encontrados: ${missingIds.join(', ')}`,
            404
        );
    }

    // 3b. Construir mapa para acceso O(1) dentro del loop
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 3c. Verificar stock disponible en stock_online por cada ítem
    for (const item of cartItems) {
        const product = productMap.get(item.product_id);
        const available = product.stock_online?.quantity ?? 0;

        if (available < item.quantity) {
            throw new CheckoutError(
                `Stock insuficiente para "${product.brand} ${product.model}". ` +
                `Disponible: ${available}, solicitado: ${item.quantity}.`,
                409 // Conflict
            );
        }
    }

    // ─── 4. Calcular totales pre-transacción (optimización) ──────────────────
    let totalAmount = 0;
    const resolvedItems = cartItems.map((item) => {
        const product = productMap.get(item.product_id);
        const unitPrice = resolveUnitPrice(product, item.quantity, isWholesaler);
        totalAmount += unitPrice * item.quantity;
        return { ...item, unit_price: unitPrice };
    });

    // ─── 5. Transacción ACID ──────────────────────────────────────────────────
    //
    // Usamos prisma.$transaction con isolationLevel SERIALIZABLE para garantizar
    // que dos checkouts concurrentes sobre el mismo producto no pasen ambos la
    // validación de stock. El READ dentro de la TX re-lee el estado real del stock.
    //
    const order = await prisma.$transaction(
        async (tx) => {
            // 5a. Re-verificar stock DENTRO de la TX (protege contra race conditions)
            const freshStocks = await tx.stockOnline.findMany({
                where: { product_id: { in: productIds } },
                select: { product_id: true, quantity: true },
            });

            const stockMap = new Map(freshStocks.map((s) => [s.product_id, s.quantity]));

            for (const item of resolvedItems) {
                const available = stockMap.get(item.product_id) ?? 0;
                if (available < item.quantity) {
                    const product = productMap.get(item.product_id);
                    throw new CheckoutError(
                        `Stock agotado para "${product.brand} ${product.model}" durante el proceso. ` +
                        `Intenta nuevamente.`,
                        409
                    );
                }
            }

            // 5b. Crear la orden en estado Pending
            const newOrder = await tx.order.create({
                data: {
                    user_id: userId,
                    status: 'Pending',
                    total_amount: totalAmount,
                },
            });

            // 5c. Insertar los ítems de la orden
            await tx.orderItem.createMany({
                data: resolvedItems.map((item) => ({
                    order_id: newOrder.id,
                    product_id: item.product_id,
                    stock_source: 'online',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
            });

            // 5d. Descontar stock en stock_online (UPDATE atómico por producto)
            await Promise.all(
                resolvedItems.map((item) =>
                    tx.stockOnline.update({
                        where: { product_id: item.product_id },
                        data: { quantity: { decrement: item.quantity } },
                    })
                )
            );

            return newOrder;
        },
        { isolationLevel: 'Serializable' }
    );

    // ─── 6. Respuesta estructurada ────────────────────────────────────────────
    return {
        order_id: order.id,
        status: order.status,
        total_amount: Number(order.total_amount),
        items_count: resolvedItems.length,
    };
}
