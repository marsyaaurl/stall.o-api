import "dotenv/config";
import { prisma } from "./config/prisma.js";

async function main() {
  const sellerId = "2ae5d3e1-e8ef-4ebf-a583-a23d080b40b1";
  console.log(`🌱 Seeding database for Seller ID: ${sellerId}...`);

  // 1. Ensure User exists
  const user = await prisma.user.upsert({
    where: { id: sellerId },
    update: {
      role: "SELLER",
      status: "ACTIVE",
    },
    create: {
      id: sellerId,
      email: "marsya.aureliasyah@gmail.com",
      name: "Marsya Aurelia",
      provider: "GOOGLE",
      providerId: "google-oauth-id-2ae5d3e1",
      role: "SELLER",
      status: "ACTIVE",
    },
  });
  console.log("✅ User profile verified:", user.name);

  // 2. Upsert Seller Profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: sellerId },
    update: {
      businessName: "Marsya's Artisan Bakery",
      phoneNumber: "+6281234567890",
      businessAddress: "Universitas Indonesia Campus Area",
    },
    create: {
      userId: sellerId,
      businessName: "Marsya's Artisan Bakery",
      phoneNumber: "+6281234567890",
      businessAddress: "Universitas Indonesia Campus Area",
    },
  });
  console.log("✅ Seller profile set:", sellerProfile.businessName);

  // 3. Create Vending Machines
  const machine1 = await prisma.vendingMachine.upsert({
    where: { machineCode: "VM-UI-01" },
    update: {},
    create: {
      machineCode: "VM-UI-01",
      name: "UI Campus Hub #01",
      locationName: "Library Building A",
      address: "Universitas Indonesia, Depok",
      customerQrCode: "QR-VM-UI-01",
      status: "ACTIVE",
    },
  });

  const machine2 = await prisma.vendingMachine.upsert({
    where: { machineCode: "VM-[#02]" },
    update: {},
    create: {
      machineCode: "VM-[#02]",
      name: "Blok M Tech Station",
      locationName: "Blok M Hub",
      address: "South Jakarta",
      customerQrCode: "QR-VM-BLOKM-02",
      status: "ACTIVE",
    },
  });
  console.log("✅ Vending machines ready:", machine1.name, "&", machine2.name);

  // 4. Create Slots for Machine 1
  const slotA1 = await prisma.machineSlot.upsert({
    where: {
      machineId_slotCode: { machineId: machine1.id, slotCode: "A01" },
    },
    update: {},
    create: {
      machineId: machine1.id,
      slotCode: "A01",
      slotNumber: 1,
      capacity: 10,
      status: "OCCUPIED",
    },
  });

  const slotA2 = await prisma.machineSlot.upsert({
    where: {
      machineId_slotCode: { machineId: machine1.id, slotCode: "A02" },
    },
    update: {},
    create: {
      machineId: machine1.id,
      slotCode: "A02",
      slotNumber: 2,
      capacity: 10,
      status: "OCCUPIED",
    },
  });

  // 5. Create Products for Seller
  const product1 = await prisma.product.create({
    data: {
      sellerId,
      name: "Tuna Melt Sandwich",
      description: "Freshly toasted sourdough with tuna, cheddar cheese & mayo",
      category: "FOOD",
      defaultPrice: 25000,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      sellerId,
      name: "Matcha Oat Latte",
      description: "Uji matcha with organic oat milk",
      category: "DRINK",
      defaultPrice: 28000,
    },
  });

  const product3 = await prisma.product.create({
    data: {
      sellerId,
      name: "Artisanal Choco Cookie",
      description: "Valrhona dark chocolate chunk cookie",
      category: "SNACK",
      defaultPrice: 15000,
    },
  });
  console.log("✅ Created products:", product1.name, product2.name, product3.name);

  // 6. Create Reservation
  const now = new Date();
  const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  const reservation = await prisma.reservation.create({
    data: {
      reservationCode: `RES-${Date.now().toString().slice(-6)}`,
      sellerId,
      machineId: machine1.id,
      reservationDate: now,
      startTime: now,
      endTime,
      status: "COMPLETED",
      slots: {
        create: [
          { machineSlotId: slotA1.id },
          { machineSlotId: slotA2.id },
        ],
      },
    },
  });
  console.log("✅ Created active reservation:", reservation.reservationCode);

  // 7. Create Product Batches (One batch expiring in 3 hours to test actionRequired!)
  const expiringBatch = await prisma.productBatch.create({
    data: {
      batchCode: `BATCH-TUNA-${Date.now().toString().slice(-4)}`,
      productId: product1.id,
      sellerId,
      reservationId: reservation.id,
      machineSlotId: slotA1.id,
      quantity: 10,
      remainingQuantity: 6,
      price: 25000,
      originalPrice: 25000,
      expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000), // Expires in 3 hours!
      status: "ACTIVE",
    },
  });

  const drinkBatch = await prisma.productBatch.create({
    data: {
      batchCode: `BATCH-MATCHA-${Date.now().toString().slice(-4)}`,
      productId: product2.id,
      sellerId,
      reservationId: reservation.id,
      machineSlotId: slotA2.id,
      quantity: 12,
      remainingQuantity: 10,
      price: 28000,
      originalPrice: 28000,
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      status: "ACTIVE",
    },
  });
  console.log("✅ Product batches loaded into vending slots!");

  // 8. Create Customer Sales Orders Today
  const order1 = await prisma.customerOrder.create({
    data: {
      orderCode: `ORD-${Date.now().toString().slice(-6)}`,
      machineId: machine1.id,
      totalAmount: 106000,
      status: "COMPLETED",
      paymentStatus: "PAID",
      createdAt: now,
      items: {
        create: [
          {
            productBatchId: expiringBatch.id,
            quantity: 2,
            unitPrice: 25000,
            subtotal: 50000,
          },
          {
            productBatchId: drinkBatch.id,
            quantity: 2,
            unitPrice: 28000,
            subtotal: 56000,
          },
        ],
      },
    },
  });

  console.log("✅ Customer order seeded:", order1.orderCode, "- Total: Rp 106.000");
  console.log("\n🎉 Database seed completed successfully for Marsya Aurelia!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
