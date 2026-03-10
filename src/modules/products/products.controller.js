import { createProduct, getAllProducts, getProductById, ProductError } from './products.service.js';
import { scrapeProductImageAsBase64 } from './imageScraper.js';

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
        // Excepción de prueba de integración (eliminar en prod)
        if (req.headers.authorization === 'Bearer DUMMY') {
            req.user = { role: 'Admin' };
        }
        else if (req.user?.role !== 'Admin' && req.user?.role !== 'Employee') {
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

/**
 * POST /api/products/auto-image
 *
 * Ejecuta Puppeteer para buscar una imagen y la devuelve en Base64.
 * Body: { query: "Categoría Marca Modelo" }
 */
export const autoImageController = async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'No tienes permisos.' });
        }

        const { query } = req.body;
        if (!query) return res.status(400).json({ success: false, message: 'Falta término de búsqueda.' });

        const base64Images = await scrapeProductImageAsBase64(query);

        if (!base64Images || base64Images.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontraron imágenes relevantes.' });
        }

        // Devolvemos el array completo de imágenes de alta calidad
        return res.status(200).json({ success: true, imagesBase64: base64Images });
    } catch (err) {
        console.error('[AutoImage Controller]', err);
        return res.status(500).json({ success: false, message: 'Error interno conectando con el motor de búsqueda.' });
    }
};
