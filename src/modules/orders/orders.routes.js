import { Router } from 'express';
import * as ordersController from './orders.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireRoles } from '../../middlewares/roles.middleware.js';

const router = Router();

// GET /api/orders - List orders (Client sees own, Admin/Employee sees all)
router.get('/', authenticate, ordersController.getOrders);

// POST /api/orders/reject - Reject an order (Admin/Employee only)
router.post('/reject', authenticate, requireRoles('Admin', 'Employee'), ordersController.rejectOrder);

export default router;
