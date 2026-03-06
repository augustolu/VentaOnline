import { createProduct, getAllProducts, getProductById, ProductError } from './products.service.js';

function handleError(res, error) {
    if (error instanceof ProductError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('[ProductsController]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
}

/**
 * POST /api/products
 *
 * Crea un producto nuevo en la DB. Requiere rol Admin o Employee.
 */
export const createProductController = async (req, res) => {
    try {
        // req.user inyectado por auth middleware
        if (req.user.role !== 'Admin' && req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'No tienes permisos para realizar esta acción.' });
        }

        const result = await createProduct(req.body);
        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        return handleError(res, err);
    }
};

/**
 * GET /api/products
 *
 * Obtiene todos los productos de la DB. Público.
 */
export const getAllProductsController = async (req, res) => {
    try {
        const products = await getAllProducts();
        return res.status(200).json({ success: true, data: products });
    } catch (err) {
        return handleError(res, err);
    }
};

/**
 * GET /api/products/:id
 *
 * Obtiene un producto individual por ID. Público.
 */
export const getProductByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);
        return res.status(200).json({ success: true, data: product });
    } catch (err) {
        return handleError(res, err);
    }
};
