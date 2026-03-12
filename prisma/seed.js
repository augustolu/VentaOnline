import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seedeo de base de datos...');

    const roles = [
        { name: 'Developer', description: 'Acceso total y herramientas de desarrollo avanzadas.' },
        { name: 'Admin', description: 'Acceso total al sistema. Gestiona usuarios, productos y configuración.' },
        { name: 'Employee', description: 'Gestiona pedidos, stock y comprobantes de pago.' },
        { name: 'Client', description: 'Cliente final. Puede comprar y ver sus propias órdenes.' },
        { name: 'Wholesaler', description: 'Cliente mayorista. Accede a precios especiales y mayores volúmenes.' }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    console.log('✅ Roles insertados correctamente.');
}

main()
    .catch((e) => {
        console.error('❌ Error durante el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
