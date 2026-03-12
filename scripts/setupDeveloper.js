import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Puedes cambiar el email aquí o pasarlo por argumento si prefieres
    const email = 'developer@ventaonline.com';
    const password = 'developer123';

    console.log(`🔄 Buscando o creando el rol 'Developer'...`);
    let devRole = await prisma.role.findUnique({
        where: { name: 'Developer' }
    });

    if (!devRole) {
        console.log(`⚠️ Rol 'Developer' no encontrado. Creándolo...`);
        devRole = await prisma.role.create({
            data: {
                name: 'Developer',
                description: 'Acceso total y herramientas de desarrollo avanzadas.'
            }
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    console.log(`🔄 Configurando el usuario ${email}...`);
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role_id: devRole.id,
            password_hash: hashedPassword
        },
        create: {
            email,
            password_hash: hashedPassword,
            first_name: 'Dev',
            last_name: 'User',
            role_id: devRole.id
        }
    });

    console.log(`✅ ¡Cuenta de Developer configurada con éxito!`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log(`🛡️ Rol Asignado: Developer`);
}

main()
    .catch((e) => {
        console.error("❌ Error al configurar Developer: ", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
