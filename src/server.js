import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Routers de módulos
import authRoutes from './modules/auth/auth.routes.js';
import checkoutRoutes from './modules/checkout/checkout.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import productRoutes from './modules/products/products.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import uploadRoutes from './modules/upload/upload.routes.js';
import aiRoutes from './modules/ai/ai.routes.js';

const app = express();
// Usa API_PORT para no colisionar con Next.js que ocupa PORT=3000
const PORT = process.env.API_PORT ?? 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.APP_BASE_URL ?? 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sirve los comprobantes de pago e imágenes de productos subidos localmente
// Asegura que lea desde /public/uploads/ donde multer está guardando las imágenes
app.use('/uploads', express.static('public/uploads'));
app.use('/uploads', express.static('uploads')); // Mantenemos el fallback si hay comprobantes acá

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Handler global de errores no capturados ───────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[Express] Error no capturado:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 API Express corriendo en http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export default app;
