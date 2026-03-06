import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/roles.middleware.js';
import { upload } from './payments.multer.js';
import { validateUploadReceipt, validateVerify } from './payments.validator.js';
import { uploadReceiptController, verifyPaymentController } from './payments.controller.js';

const router = Router();

// Todas las rutas del módulo requieren autenticación
router.use(authenticate);

/**
 * POST /api/payments/upload-receipt
 *
 * Orden de middlewares:
 *  1. authenticate     — verifica JWT, inyecta req.user
 *  2. upload.single    — procesa multipart/form-data, valida tipo y tamaño
 *  3. validateUploadReceipt — valida campos del body con Zod
 *  4. uploadReceiptController — lógica de negocio
 *
 * Acceso: cualquier usuario autenticado (dueño de la orden)
 */
router.post(
    '/upload-receipt',
    upload.single('receipt'),        // campo multipart: "receipt"
    validateUploadReceipt,
    uploadReceiptController,
);

/**
 * POST /api/payments/verify
 *
 * Orden de middlewares:
 *  1. authenticate     — verifica JWT, inyecta req.user
 *  2. requireRoles     — RBAC: solo Admin o Employee
 *  3. validateVerify   — valida body con Zod
 *  4. verifyPaymentController — lógica de negocio
 *
 * Acceso restringido: Admin, Employee
 */
router.post(
    '/verify',
    requireRoles('Admin', 'Employee'),
    validateVerify,
    verifyPaymentController,
);

export default router;
