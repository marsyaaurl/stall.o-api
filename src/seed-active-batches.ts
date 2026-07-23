import { prisma } from "./config/prisma.js";

async function main() {
  console.log("Stocking machine MAC-001 with active product batches...");

  // 1. Find the seller
  const seller = await prisma.user.findFirst({
    where: { role: "SELLER" },
  });

  if (!seller) {
    throw new Error("No seller found in the database. Please run seed script first.");
  }

  // 2. Find the machine MAC-001
  const machine = await prisma.vendingMachine.findUnique({
    where: { machineCode: "MAC-001" },
    include: { slots: true },
  });

  if (!machine) {
    throw new Error("Machine MAC-001 not found.");
  }

  // 3. Find the products
  const products = await prisma.product.findMany();
  if (products.length === 0) {
    throw new Error("No products found.");
  }

  // 4. Create an active reservation for the seller on MAC-001 if one doesn't exist
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
  const startTime = now;
  const endTime = expiresAt;

  // Let's find or create a reservation
  let reservation = await prisma.reservation.findFirst({
    where: {
      sellerId: seller.id,
      machineId: machine.id,
      status: "COMPLETED",
    },
  });

  const slotsToOccupy = ["A1", "A2", "A3"];
  const slotRecords = machine.slots.filter(s => slotsToOccupy.includes(s.slotCode));

  if (!reservation) {
    reservation = await prisma.reservation.create({
      data: {
        reservationCode: `RES-MAC1-${Date.now().toString().slice(-4)}`,
        sellerId: seller.id,
        machineId: machine.id,
        reservationDate: now,
        startTime,
        endTime,
        status: "COMPLETED",
        slots: {
          create: slotRecords.map(s => ({
            machineSlotId: s.id,
          })),
        },
      },
    });
    console.log(`Created reservation ${reservation.reservationCode} for MAC-001`);
  }

  // 5. Stock the slots A1, A2, A3 with product batches expiring in 5 days
  const batchMapping = [
    { slotCode: "A1", productIndex: 0, quantity: 10, remainingQuantity: 8, price: 25000, code: "TUNA" },
    { slotCode: "A2", productIndex: 1, quantity: 15, remainingQuantity: 12, price: 28000, code: "BIBIM" },
    { slotCode: "A3", productIndex: 2, quantity: 8, remainingQuantity: 5, price: 15000, code: "MATCHA" },
  ];

  for (const mapping of batchMapping) {
    const slot = slotRecords.find(s => s.slotCode === mapping.slotCode);
    if (!slot) continue;

    // Use a modulo or fallback if there are fewer products in database than expected
    const product = products[mapping.productIndex % products.length];

    // Check if slot already has an active batch, if so update it, otherwise create
    const existingBatch = await prisma.productBatch.findFirst({
      where: {
        machineSlotId: slot.id,
        productId: product.id,
        status: "ACTIVE",
      }
    });

    if (existingBatch) {
      await prisma.productBatch.update({
        where: { id: existingBatch.id },
        data: {
          remainingQuantity: mapping.remainingQuantity,
          expiresAt,
          price: mapping.price,
        }
      });
      console.log(`Updated existing batch in slot ${mapping.slotCode} for ${product.name} to expire in 5 days.`);
    } else {
      const newBatch = await prisma.productBatch.create({
        data: {
          batchCode: `B-${mapping.code}-${Date.now().toString().slice(-4)}`,
          productId: product.id,
          sellerId: seller.id,
          reservationId: reservation.id,
          machineSlotId: slot.id,
          quantity: mapping.quantity,
          remainingQuantity: mapping.remainingQuantity,
          price: mapping.price,
          originalPrice: mapping.price,
          expiresAt,
          status: "ACTIVE",
        }
      });
      console.log(`Created active batch ${newBatch.batchCode} in slot ${mapping.slotCode} for ${product.name}.`);
    }

    // Set slot status to OCCUPIED
    await prisma.machineSlot.update({
      where: { id: slot.id },
      data: { status: "OCCUPIED" },
    });
  }

  console.log("Successfully stocked machine MAC-001!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
