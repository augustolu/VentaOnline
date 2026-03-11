import { Router } from 'express';
import { createProductController, getAllProductsController, getProductByIdController, autoImageController, updateProductController, bulkDeleteController, bulkUpdatePriceController } from './products.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/products/auto-image (Debe ir antes de /:id para no chocar)
router.post('/auto-image', authenticate, autoImageController);

// POST /api/products (Protegido por JWT)
router.post('/', authenticate, createProductController);

// GET /api/products (Público)
router.get('/', getAllProductsController);

// GET /api/products/:id (Público)
router.get('/:id', getProductByIdController);

// PUT /api/products/:id (Protegido por JWT Admin/Employee)
router.put('/:id', authenticate, updateProductController);

// DELETE /api/products/:id (Protegido por JWT Admin/Employee)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'No tienes permisos.' });
        }
        const { deleteProduct } = await import('./products.service.js');
        const result = await deleteProduct(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
});

// PATCH /api/products/:id/stock (Protegido por JWT Admin/Employee)
router.patch('/:id/stock', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'No tienes permisos.' });
        }
        const { updateProductStock } = await import('./products.service.js');
        const result = await updateProductStock(req.params.id, req.body);
        res.status(200).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
});

// POST /api/products/:id/sale (Protegido por JWT Admin/Employee)
router.post('/:id/sale', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'Admin' && req.user.role !== 'Employee') {
            return res.status(403).json({ success: false, message: 'No tienes permisos.' });
        }
        const { registerPhysicalSale } = await import('./products.service.js');
        const result = await registerPhysicalSale(req.params.id, req.body, req.user.id);
        res.status(201).json({ success: true, data: result });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }
});

// Rutas Masivas (Bulk)
router.post('/bulk-delete', authenticate, bulkDeleteController);
router.patch('/bulk-price', authenticate, bulkUpdatePriceController);

export default router;
