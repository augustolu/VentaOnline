import { Router } from 'express';
import { optionalAuthenticate, authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/roles.middleware.js';
import { upload } from './payments.multer.js';
import { validateUploadReceipt, validateVerify } from './payments.validator.js';
import { uploadReceiptController, verifyPaymentController } from './payments.controller.js';

const router = Router();

// Middleware base: opcional para permitir subir comprobantes sin sesión
// pero la verificación (verify) requiere roles (implica auth)
router.post(
    '/upload-receipt',
    optionalAuthenticate,
    upload.single('receipt'),
    validateUploadReceipt,
    uploadReceiptController,
);

router.post(
    '/verify',
    authenticate,
    requireRoles('Admin', 'Employee'),
    validateVerify,
    verifyPaymentController,
);

export default router;
