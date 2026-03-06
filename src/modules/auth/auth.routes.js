import { Router } from 'express';
import { validateRegister, validateLogin } from './auth.validator.js';
import { registerController, loginController, logoutController, meController } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/auth/register — público
router.post('/register', validateRegister, registerController);

// POST /api/auth/login — público
router.post('/login', validateLogin, loginController);

// POST /api/auth/logout — autenticado (para auditoría futura con Redis)
router.post('/logout', authenticate, logoutController);

// GET /api/auth/me — retorna datos del usuario actual desde el token
router.get('/me', authenticate, meController);

export default router;
