import { verifyToken } from '../modules/auth/auth.service.js';
import { AuthError } from '../modules/auth/auth.errors.js';

/**
 * Middleware de autenticación JWT.
 *
 * Extrae el token del header Authorization: Bearer <token>
 * o de la cookie `token` (útil para el frontend Next.js).
 *
 * Al verificar con éxito, inyecta en req.user:
 *   { id, email, role }
 *
 * Uso: router.get('/protected', authenticate, handler)
 */
export function authenticate(req, res, next) {
    try {
        // 1. Extraer token — soporta header Bearer y cookie
        let token = null;

        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.slice(7);
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida. Por favor iniciá sesión.',
            });
        }

        // 2. Verificar y decodificar token
        const payload = verifyToken(token);

        // 3. Normalizar req.user (estándar usado en todos los servicios)
        req.user = {
            id: payload.sub,    // UUID del usuario
            email: payload.email,
            role: payload.role,   // 'Admin' | 'Employee' | 'Client' | 'Wholesaler'
        };

        next();
    } catch (err) {
        if (err instanceof AuthError) {
            return res.status(err.statusCode).json({ success: false, message: err.message });
        }
        return res.status(401).json({ success: false, message: 'Token inválido.' });
    }
}

/**
 * Alias para mayor legibilidad en las rutas.
 */
export const requireAuth = authenticate;

/**
 * Middleware para restringir acceso solo a Administradores.
 * Debe usarse DESPUÉS de requireAuth/authenticate.
 */
export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Se requiere rol de Administrador.',
        });
    }
    next();
}
