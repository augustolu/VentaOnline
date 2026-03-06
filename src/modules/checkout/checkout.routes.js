import { Router } from 'express';
import { checkoutController } from './checkout.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validateCheckout } from './checkout.validator.js';

const router = Router();

/**
 * POST /api/checkout
 * Procesa el carrito y crea una orden en estado Pending.
 * Requiere usuario autenticado (JWT).
 */
router.post('/', authenticate, validateCheckout, checkoutController);

export default router;
