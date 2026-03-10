import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'augustoluceropollio@gmail.com';
    const password = 'augusto123';

    console.log(`🔄 Buscando o creando el rol 'Admin'...`);
    let adminRole = await prisma.role.findUnique({
        where: { name: 'Admin' }
    });

    if (!adminRole) {
        console.log(`⚠️ Rol 'Admin' no encontrado. Creándolo...`);
        adminRole = await prisma.role.create({
            data: {
                name: 'Admin',
                description: 'Administrador del Sistema'
            }
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`🔄 Configurando el usuario ${email}...`);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role_id: adminRole.id,
            password_hash: hashedPassword
        },
        create: {
            email,
            password_hash: hashedPassword,
            first_name: 'Augusto',
            last_name: 'Lucero',
            role_id: adminRole.id
        }
    });

    console.log(`✅ ¡Cuenta de Administrador configurada/actualizada con éxito!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log(`🛡️ Rol Asignado: Admin`);
}

main()
    .catch((e) => {
        console.error("❌ Error al configurar Administrador: ", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
