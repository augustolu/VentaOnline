import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            role: true
        }
    });

    console.log('Total users:', users.length);
    users.forEach(u => {
        console.log(`- ${u.first_name} ${u.last_name} (${u.email}) - Role: ${u.role.name}`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
