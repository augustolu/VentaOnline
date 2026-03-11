import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const confirm = process.argv.includes('--confirm');

    if (!confirm) {
        console.log('⚠️  ADVERTENCIA: Este script borrará TODOS los datos dinámicos (productos, usuarios, pedidos, auditoría).');
        console.log('Para confirmar la acción, ejecuta el script con la bandera --confirm:');
        console.log('node scripts/wipeData.js --confirm');
        process.exit(0);
    }

    console.log('🚀 Iniciando limpieza total de la base de datos...');

    try {
        await prisma.$transaction(async (tx) => {
            console.log('- Borrando AuditLogs...');
            await tx.auditLog.deleteMany({});

            console.log('- Borrando PaymentReceipts...');
            await tx.paymentReceipt.deleteMany({});

            console.log('- Borrando Payments...');
            await tx.payment.deleteMany({});

            console.log('- Borrando OrderItems...');
            await tx.orderItem.deleteMany({});

            console.log('- Borrando Orders...');
            await tx.order.deleteMany({});

            console.log('- Borrando Sales...');
            await tx.sale.deleteMany({});

            console.log('- Borrando StockOnline...');
            await tx.stockOnline.deleteMany({});

            console.log('- Borrando StockPhysical...');
            await tx.stockPhysical.deleteMany({});

            console.log('- Borrando WholesalePrices...');
            await tx.wholesalePrice.deleteMany({});

            console.log('- Borrando Products...');
            await tx.product.deleteMany({});

            console.log('- Borrando Users...');
            await tx.user.deleteMany({});

            console.log('✅ Base de datos vaciada con éxito.');
        });
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
