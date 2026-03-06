import { PrismaClient } from '@prisma/client';

/**
 * Singleton del cliente Prisma.
 * En desarrollo evita crear múltiples conexiones por hot-reload.
 * En producción garantiza una única instancia por proceso.
 */
const globalForPrisma = globalThis;

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['warn', 'error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
