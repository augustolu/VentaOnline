import { Router } from 'express';
import { generateDescription, autocompleteProduct } from './ai.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/ai/autocomplete-product (Protegido, solo para Staff)
router.post('/autocomplete-product', authenticate, autocompleteProduct);

// POST /api/ai/generate-description (Protegido, solo para Staff)
router.post('/generate-description', authenticate, generateDescription);

export default router;
