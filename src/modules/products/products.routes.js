import { Router } from 'express';
import { createProductController, getAllProductsController, getProductByIdController } from './products.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/products (Protegido por JWT)
router.post('/', authenticate, createProductController);

// GET /api/products (Público)
router.get('/', getAllProductsController);

// GET /api/products/:id (Público)
router.get('/:id', getProductByIdController);

export default router;
