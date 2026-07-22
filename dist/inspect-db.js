import { prisma } from "./config/prisma.js";
async function main() {
    const sellerId = "2ae5d3e1-e8ef-4ebf-a583-a23d080b40b1";
    const products = await prisma.product.findMany({ where: { sellerId } });
    const machines = await prisma.vendingMachine.findMany();
    const batches = await prisma.productBatch.findMany({ where: { sellerId } });
    const orders = await prisma.customerOrder.findMany();
    console.log("Products count:", products.length);
    console.log("Machines count:", machines.length);
    console.log("Batches count:", batches.length);
    console.log("Orders count:", orders.length);
    console.log("\nProducts:", products.map(p => ({ id: p.id, name: p.name })));
    console.log("\nMachines:", machines.map(m => ({ id: m.id, name: m.name })));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
