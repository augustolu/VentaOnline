import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/auth.middleware.js';
import * as usersController from './users.controller.js';

const router = Router();

// ── Rutas protegidas (Administración) ─────────────────────────────────────────

// GET /api/users - Lista todos los usuarios ordenados por prioridad (incluye solicitudes pendientes)
router.get('/', requireAuth, requireAdmin, usersController.getAllUsers);

// GET /api/users/roles - Lista todos los roles disponibles
router.get('/roles', requireAuth, requireAdmin, usersController.getRoles);

// PATCH /api/users/request-role/:id - Aprobar o rechazar solicitud de rol (Wholesaler)
router.patch('/request-role/:id', requireAuth, requireAdmin, usersController.handleRoleRequest);

// PATCH /api/users/:id/role - Actualizar rol manualmente
router.patch('/:id/role', requireAuth, requireAdmin, usersController.updateUserRoleManually);


// ── Rutas protegidas (Usuarios Logueados) ─────────────────────────────────────

// POST /api/users/request-role - Cliente solicita convertirse en Wholesaler
router.post('/request-role', requireAuth, usersController.requestWholesalerRole);


export default router;
