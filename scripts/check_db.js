import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const roleCount = await prisma.role.count();
    const admin = await prisma.user.findUnique({ where: { email: 'augustoluceropollio@gmail.com' } });

    console.log('--- Database Status ---');
    console.log('Users:', userCount);
    console.log('Products:', productCount);
    console.log('Roles:', roleCount);
    console.log('Admin User exists:', !!admin);
    if (admin) console.log('Admin Email:', admin.email);
}

check().catch(console.error).finally(() => prisma.$disconnect());
