import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { AuthError } from './auth.errors.js';

// ── Constantes ─────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';
const SALT_ROUNDS = 12;

// ID del rol "Client" — se resuelve en runtime para no hardcodear UUIDs
let CLIENT_ROLE_ID = null;

async function getClientRoleId() {
    if (CLIENT_ROLE_ID) return CLIENT_ROLE_ID;
    const role = await prisma.role.findUnique({ where: { name: 'Client' } });
    if (!role) throw new AuthError('Rol "Client" no encontrado en la BD.', 500);
    CLIENT_ROLE_ID = role.id;
    return CLIENT_ROLE_ID;
}

// ── Helpers de token ────────────────────────────────────────────────────────

/**
 * Genera un JWT firmado con los datos esenciales del usuario.
 * El payload NO incluye password_hash ni datos sensibles.
 *
 * @param {object} user - Fila de la tabla users con role incluido.
 * @returns {string} token JWT
 */
export function signToken(user) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET no está definido en las variables de entorno.');

    return jwt.sign(
        {
            sub: user.id,           // subject — ID estándar JWT
            email: user.email,
            role: user.role.name,    // 'Admin' | 'Employee' | 'Client' | 'Wholesaler'
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * Verifica y decodifica un JWT.
 * @param {string} token
 * @returns {object} payload decodificado
 * @throws {AuthError}
 */
export function verifyToken(token) {
    if (!JWT_SECRET) throw new Error('JWT_SECRET no está definido.');
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AuthError('La sesión expiró. Por favor iniciá sesión nuevamente.', 401);
        }
        throw new AuthError('Token de autenticación inválido.', 401);
    }
}

// ── Servicio: registrar usuario ─────────────────────────────────────────────

/**
 * Registra un nuevo usuario con rol especificado.
 *
 * @param {{ email, password, first_name, last_name, phone, role_name, admin_secret }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function registerUser({ email, password, first_name, last_name, phone, role_name, admin_secret }) {
    // 1. Verificar email único
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AuthError('Ya existe una cuenta con ese email.', 409);
    }

    // 2. Hashear contraseña
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Resolver el rol
    let roleName = role_name || 'Client';

    // Validación simplificada: Si intenta crear un rol elevado, debe proveer un secreto.
    // En producción esto se valida a través del token JWT del usuario que hace la petición.
    if (['Admin', 'Employee', 'Wholesaler'].includes(roleName)) {
        const bypassSecret = process.env.ADMIN_REGISTRATION_SECRET || 'VentaOnline2026';
        if (admin_secret !== bypassSecret) {
            throw new AuthError(`No autorizado para crear cuenta con rol ${roleName}.`, 403);
        }
    }

    const dbRole = await prisma.role.findUnique({ where: { name: roleName } });
    if (!dbRole) {
        throw new AuthError(`El rol "${roleName}" no existe en la BD.`, 400);
    }
    const role_id = dbRole.id;

    // 4. Crear usuario
    const user = await prisma.user.create({
        data: { email, password_hash, first_name, last_name, phone, role_id },
        select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            created_at: true,
            role: { select: { name: true } },
        },
    });

    // 5. Generar token
    const token = signToken(user);

    return { token, user };
}

// ── Servicio: iniciar sesión ────────────────────────────────────────────────

/**
 * Autentica un usuario existente y devuelve un JWT.
 *
 * @param {{ email, password }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginUser({ email, password }) {
    // 1. Buscar usuario por email (incluye hash para comparar)
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            password_hash: true,
            first_name: true,
            last_name: true,
            role: { select: { name: true } },
        },
    });

    // Mensaje genérico para no filtrar si el email existe o no
    const INVALID_MSG = 'Email o contraseña incorrectos.';

    if (!user) throw new AuthError(INVALID_MSG, 401);

    // 2. Comparar contraseña
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new AuthError(INVALID_MSG, 401);

    // 3. Generar token (sin exponer password_hash)
    const { password_hash: _, ...safeUser } = user;
    const token = signToken(safeUser);

    return { token, user: safeUser };
}
