import { prisma } from "./config/prisma.js";

async function main() {
  const batches = await prisma.productBatch.findMany({
    include: {
      product: true,
      machineSlot: {
        include: {
          machine: true
        }
      }
    }
  });
  
  console.log("Current Product Batches in Database:\n");
  console.log(batches.map(b => ({
    id: b.id,
    productName: b.product.name,
    remainingQuantity: b.remainingQuantity,
    status: b.status,
    expiresAt: b.expiresAt,
    machineCode: b.machineSlot.machine.machineCode,
    machineName: b.machineSlot.machine.name,
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
