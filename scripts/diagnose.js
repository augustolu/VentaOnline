import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    console.log('--- Database Diagnostics ---');
    try {
        const roles = await prisma.role.findMany();
        console.log('Available Roles:');
        roles.forEach(r => console.log(`- ID: ${r.id}, Name: "${r.name}"`));

        const users = await prisma.user.findMany({
            include: { role: true }
        });
        console.log('\nUsers:');
        users.forEach(u => console.log(`- Email: ${u.email}, Role: "${u.role.name}"`));

        const ordersCount = await prisma.order.count();
        console.log(`\nTotal Orders in DB: ${ordersCount}`);

    } catch (error) {
        console.error('Diagnostic error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
