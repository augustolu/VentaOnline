import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMAIL = process.argv[2] || 'augustoluceropollio@gmail.com';
const PASSWORD = process.argv[3] || 'Admin1234!';
const FIRST_NAME = process.argv[4] || 'Augusto';
const LAST_NAME = process.argv[5] || 'Lucero';

async function main() {
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
        console.error('❌ Rol Admin no encontrado. Asegurate de que los roles estén seed-eados.');
        process.exit(1);
    }

    const password_hash = await bcrypt.hash(PASSWORD, 12);

    const user = await prisma.user.upsert({
        where: { email: EMAIL },
        update: { role_id: adminRole.id },
        create: {
            email: EMAIL,
            password_hash,
            first_name: FIRST_NAME,
            last_name: LAST_NAME,
            role_id: adminRole.id,
        },
    });

    console.log(`✅ Usuario ${user.email} configurado como Admin.`);
    console.log(`   Contraseña establecida: ${PASSWORD}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
