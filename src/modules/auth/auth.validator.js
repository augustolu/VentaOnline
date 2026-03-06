import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' }),
    first_name: z.string().min(1).max(100),
    last_name: z.string().min(1).max(100),
    phone: z.string().optional(),
    // role_id es opcional al registrarse: el sistema asigna "Client" por defecto
});

const loginSchema = z.object({
    email: z.string().email({ message: 'Email inválido.' }),
    password: z.string().min(1, { message: 'La contraseña es requerida.' }),
});

function makeValidator(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos.',
                errors: result.error.flatten().fieldErrors,
            });
        }
        req.body = result.data;
        next();
    };
}

export const validateRegister = makeValidator(registerSchema);
export const validateLogin = makeValidator(loginSchema);
