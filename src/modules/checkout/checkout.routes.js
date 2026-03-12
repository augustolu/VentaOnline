import { Router } from 'express';
import { checkoutController, cleanupController } from './checkout.controller.js';
import { optionalAuthenticate } from '../../middlewares/auth.middleware.js';
import { validateCheckout } from './checkout.validator.js';

const router = Router();

/**
 * POST /api/checkout
 * Procesa el carrito y crea una orden en estado Pending.
 * Soporta usuarios registrados y invitados (Guest Checkout).
 */
router.post('/', optionalAuthenticate, validateCheckout, checkoutController);

/**
 * POST /api/checkout/cleanup
 * Disparamos la limpieza de stock manualmente desde el cliente al expirar.
 */
router.post('/cleanup', cleanupController);

export default router;
