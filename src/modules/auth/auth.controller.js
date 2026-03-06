import { registerUser, loginUser } from './auth.service.js';
import { AuthError } from './auth.errors.js';

function handleError(res, error) {
    if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('[AuthController]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
}

/**
 * POST /api/auth/register
 *
 * Body: { email, password, first_name, last_name, phone, shadow: role_name, admin_secret }
 *
 * Respuesta 201:
 * { success: true, data: { token, user: { id, email, first_name, last_name, role } } }
 */
export const registerController = async (req, res) => {
    try {
        const result = await registerUser(req.body);
        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        return handleError(res, err);
    }
};

/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * Respuesta 200:
 * { success: true, data: { token, user: { id, email, first_name, last_name, role } } }
 */
export const loginController = async (req, res) => {
    try {
        const result = await loginUser(req.body);
        return res.status(200).json({ success: true, data: result });
    } catch (err) {
        return handleError(res, err);
    }
};

/**
 * POST /api/auth/logout
 *
 * JWT es stateless — el logout real se maneja en el cliente
 * eliminando el token. Este endpoint existe para compatibilidad
 * con clientes que esperan un endpoint de logout.
 * En Fase 3 (Redis) se agrega revocación real via blacklist.
 */
export const logoutController = (_req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Sesión cerrada. Por favor eliminá el token del lado del cliente.',
    });
};

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado desde el token.
 * Requiere authenticate middleware.
 */
export const meController = (req, res) => {
    return res.status(200).json({ success: true, data: { user: req.user } });
};
