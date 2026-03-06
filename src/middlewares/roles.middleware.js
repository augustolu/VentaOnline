/**
 * Middleware de autorización por roles (RBAC).
 *
 * Uso:
 *   router.post('/verify', requireRoles('Admin', 'Employee'), handler)
 *
 * Requiere que `authenticate` haya corrido antes e inyectado `req.user`
 * con la propiedad `role` (nombre del rol como string).
 *
 * @param  {...string} roles - Nombre(s) de rol permitidos.
 * @returns {import('express').RequestHandler}
 */
export function requireRoles(...roles) {
    const allowed = new Set(roles);

    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole || !allowed.has(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}.`,
            });
        }

        next();
    };
}
