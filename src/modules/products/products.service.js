import { prisma } from '../../lib/prisma.js';

export class ProductError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * Servicio para crear un nuevo producto con su stock y precio.
 */
export async function createProduct({
    category,
    brand,
    model,
    compatibility,
    price,
    stock_online = 0,
    stock_physical = 0,
    store_location,
    wholesale_price,
    wholesale_min_quantity = 5,
    image_url,
    description,
    features
}) {
    // 1. Validaciones básicas
    if (!category || !brand || !model || !price) {
        throw new ProductError('Faltan campos obligatorios: categoría, marca, modelo o precio.');
    }

    if (price < 0 || stock_online < 0 || stock_physical < 0) {
        throw new ProductError('Valores numéricos de precio y stock no pueden ser negativos.', 400);
    }

    // 2. Crear el producto y sus relaciones en una transacción
    const newProduct = await prisma.$transaction(async (tx) => {
        // a) Producto base
        const product = await tx.product.create({
            data: {
                category,
                brand,
                model,
                compatibility,
                price: price,
                image_url,
                description,
                features
            }
        });

        // b) Stock Online
        await tx.stockOnline.create({
            data: {
                product_id: product.id,
                quantity: stock_online
            }
        });

        // c) Stock Físico
        await tx.stockPhysical.create({
            data: {
                product_id: product.id,
                quantity: stock_physical,
                store_location
            }
        });

        // d) Precio Mayorista (opcional)
        if (wholesale_price !== undefined && wholesale_price >= 0) {
            await tx.wholesalePrice.create({
                data: {
                    product_id: product.id,
                    price: wholesale_price,
                    min_quantity: wholesale_min_quantity
                }
            });
        }

        return product;
    });

    return newProduct;
}

/**
 * Servicio para obtener todos los productos
 */
export async function getAllProducts() {
    return await prisma.product.findMany({
        orderBy: { created_at: 'desc' },
        include: {
            stock_online: true,
            stock_physical: true
        }
    });
}

/**
 * Servicio para obtener un producto por su ID
 */
export async function getProductById(id) {
    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            stock_online: true,
            stock_physical: true
        }
    });

    if (!product) {
        throw new ProductError('Producto no encontrado.', 404);
    }

    return product;
}
