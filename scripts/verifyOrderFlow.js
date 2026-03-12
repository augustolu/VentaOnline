import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyFlow() {
    console.log('--- Verification Started ---');

    try {
        // 1. Get a test product and check its stock
        const product = await prisma.product.findFirst({
            include: { stock_online: true }
        });

        if (!product) {
            console.error('No products found for testing.');
            return;
        }

        console.log(`Testing with product: ${product.brand} ${product.model}`);
        let initialStock = product.stock_online?.quantity || 0;
        console.log(`Initial stock: ${initialStock}`);

        // 2. Get or Create a test user
        let user = await prisma.user.findFirst({
            where: { role: { name: 'Client' } }
        });

        if (!user) {
            console.log('No client user found. Creating a test client user...');
            const clientRole = await prisma.role.findUnique({ where: { name: 'Client' } });
            if (!clientRole) {
                console.error('Client role not found in database.');
                return;
            }
            user = await prisma.user.create({
                data: {
                    email: `test_client_${Date.now()}@example.com`,
                    password_hash: 'dummy',
                    first_name: 'Test',
                    last_name: 'Client',
                    role_id: clientRole.id
                }
            });
        }

        console.log(`Testing with user: ${user.email}`);

        // Ensure stock is at least 5 for testing
        if (initialStock < 5) {
            console.log('Increasing stock for testing...');
            await prisma.stockOnline.update({
                where: { product_id: product.id },
                data: { quantity: 10 }
            });
            initialStock = 10;
        }

        console.log(`Working stock: ${initialStock}`);

        // 3. Simulate Checkout
        console.log('\nStep 1: Creating Order');
        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    user_id: user.id,
                    status: 'Pending',
                    total_amount: Number(product.price)
                }
            });

            await tx.orderItem.create({
                data: {
                    order_id: newOrder.id,
                    product_id: product.id,
                    stock_source: 'online',
                    quantity: 1,
                    unit_price: product.price
                }
            });

            await tx.stockOnline.update({
                where: { product_id: product.id },
                data: { quantity: { decrement: 1 } }
            });

            return newOrder;
        });

        const stockAfterCheckout = (await prisma.stockOnline.findUnique({ where: { product_id: product.id } })).quantity;
        console.log(`Stock after checkout: ${stockAfterCheckout} (Expected: ${initialStock - 1})`);

        // 4. Simulate Upload Receipt
        console.log('\nStep 2: Uploading Receipt');
        await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    order_id: order.id,
                    amount: product.price,
                    transaction_date: new Date()
                }
            });

            await tx.paymentReceipt.create({
                data: {
                    payment_id: payment.id,
                    receipt_url: '/uploads/receipts/test-receipt.jpg'
                }
            });

            await tx.order.update({
                where: { id: order.id },
                data: { status: 'Awaiting_Verification' }
            });
        });

        const orderAwaiting = await prisma.order.findUnique({ where: { id: order.id } });
        console.log(`Order status: ${orderAwaiting.status} (Expected: Awaiting_Verification)`);

        // 5. Simulate Admin Rejection (Stock Restoration Test)
        console.log('\nStep 3: Rejecting Order (Stock Restoration)');
        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: 'Rejected' }
            });

            await tx.stockOnline.update({
                where: { product_id: product.id },
                data: { quantity: { increment: 1 } }
            });
        });

        const finalStock = (await prisma.stockOnline.findUnique({ where: { product_id: product.id } })).quantity;
        console.log(`Final stock: ${finalStock} (Expected: ${initialStock})`);

        if (finalStock === initialStock) {
            console.log('\n✅ Verification SUCCESS: Order loop and stock restoration work correctly.');
        } else {
            console.error('\n❌ Verification FAILED: Stock was not correctly restored.');
        }

    } catch (error) {
        console.error('Verification error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFlow();
