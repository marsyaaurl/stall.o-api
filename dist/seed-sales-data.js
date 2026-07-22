import { prisma } from "./config/prisma.js";
async function main() {
    const sellerId = "2ae5d3e1-e8ef-4ebf-a583-a23d080b40b1";
    console.log(`🌱 Seeding rich sales and transaction history for Seller: ${sellerId}...`);
    // 1. Fetch seller's active product batches to link sales items to
    const batches = await prisma.productBatch.findMany({
        where: { sellerId },
        include: {
            product: true,
            machineSlot: true,
        },
    });
    if (batches.length === 0) {
        console.error("❌ No product batches found for this seller. Please make sure you have stocked slots or run seeds first.");
        return;
    }
    // 2. Clear existing customer orders to avoid collisions and duplicate test data
    console.log("🧹 Clearing old orders...");
    await prisma.orderItem.deleteMany({
        where: {
            productBatch: { sellerId }
        }
    });
    // Note: Delete orders that only contain items for this seller
    await prisma.customerOrder.deleteMany({
        where: {
            items: {
                none: {}
            }
        }
    });
    // 3. Define target machines
    const machines = await prisma.vendingMachine.findMany();
    // 4. Generate random orders from July 1, 2026 to July 23, 2026
    console.log(`📦 Generating sales data...`);
    const totalOrdersToSeed = 45;
    let seededOrdersCount = 0;
    for (let i = 0; i < totalOrdersToSeed; i++) {
        // Generate a date between July 1 and July 23, 2026
        const day = Math.floor(Math.random() * 23) + 1; // 1 to 23
        const hour = Math.floor(Math.random() * 14) + 8; // 8:00 to 22:00
        const minute = Math.floor(Math.random() * 60);
        const orderDate = new Date(2026, 6, day, hour, minute, 0); // Month 6 is July in JS (0-indexed)
        // Randomly pick a machine
        const machine = machines[Math.floor(Math.random() * machines.length)];
        // Randomly select 1 to 2 unique batches to purchase from
        const numItems = Math.floor(Math.random() * 2) + 1; // 1 or 2 items
        const shuffledBatches = [...batches].sort(() => 0.5 - Math.random());
        const selectedBatches = shuffledBatches.slice(0, numItems);
        const orderItemsData = [];
        let totalAmount = 0;
        for (const batch of selectedBatches) {
            const quantity = Math.floor(Math.random() * 2) + 1; // 1 or 2 units
            const price = Number(batch.price);
            const subtotal = quantity * price;
            orderItemsData.push({
                productBatchId: batch.id,
                quantity,
                unitPrice: price,
                subtotal,
            });
            totalAmount += subtotal;
        }
        // Create the order and items in a single transaction
        await prisma.customerOrder.create({
            data: {
                orderCode: `ORD-${orderDate.getTime().toString().slice(-6)}-${i}`,
                machineId: machine.id,
                totalAmount,
                status: "COMPLETED",
                paymentStatus: "PAID",
                createdAt: orderDate,
                updatedAt: orderDate,
                items: {
                    create: orderItemsData,
                },
            },
        });
        seededOrdersCount++;
    }
    console.log(`✅ Successfully seeded ${seededOrdersCount} customer sales orders with multiple items!`);
}
main()
    .catch((e) => {
    console.error("❌ Seeding sales failed:", e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
