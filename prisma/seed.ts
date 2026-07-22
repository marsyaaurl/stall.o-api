import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("Re-seeding database with 4x6 slots...");

  // 1. Find or create user
  const user = await prisma.user.upsert({
    where: { email: "marsya.aureliasyah@gmail.com" },
    update: {},
    create: {
      email: "marsya.aureliasyah@gmail.com",
      name: "marsya aurelia",
      role: "SELLER",
      status: "ACTIVE",
      provider: "GOOGLE",
      providerId: "google-oauth2|seed-seller-1",
    },
  });

  // 2. Upsert Seller Profile
  await prisma.sellerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      businessName: "Marsya's Bites",
      businessDescription: "Delicious freshly made healthy meals and beverages.",
      phoneNumber: "08123456789",
      businessAddress: "Universitas XYZ Campus Area",
    },
  });

  // 3. Define 24 slots (6 rows: A-F, 4 columns: 1-4)
  const slotCodes: string[] = [];
  const rows = ["A", "B", "C", "D", "E", "F"];
  const cols = ["1", "2", "3", "4"];
  for (const r of rows) {
    for (const c of cols) {
      slotCodes.push(`${r}${c}`);
    }
  }

  const machines = [
    {
      machineCode: "MAC-001",
      name: "Campus A - Building 2",
      locationName: "Universitas XYZ",
      address: "Building 2 Lobby, 1st Floor, Jalan Raya Kampus A",
      customerQrCode: "qr-mac-001",
      temperature: 4.2,
      humidity: 45.0,
    },
    {
      machineCode: "MAC-002",
      name: "Central Library Lobby",
      locationName: "Universitas XYZ",
      address: "Library Main Entrance, Jalan Perpustakaan No. 4",
      customerQrCode: "qr-mac-002",
      temperature: 3.8,
      humidity: 42.0,
    },
    {
      machineCode: "MAC-003",
      name: "Building C Cafeteria",
      locationName: "Universitas XYZ",
      address: "Student Center Annex, Cafeteria Courtyard",
      customerQrCode: "qr-mac-003",
      temperature: 4.5,
      humidity: 48.0,
    },
  ];

  for (const m of machines) {
    const createdMachine = await prisma.vendingMachine.upsert({
      where: { machineCode: m.machineCode },
      update: {
        temperature: m.temperature,
        humidity: m.humidity,
      },
      create: {
        machineCode: m.machineCode,
        name: m.name,
        locationName: m.locationName,
        address: m.address,
        status: "ACTIVE",
        customerQrCode: m.customerQrCode,
        temperature: m.temperature,
        humidity: m.humidity,
      },
    });

    console.log(`Machine: ${createdMachine.name}`);

    // Create 24 slots (capacity = 10)
    for (let i = 0; i < slotCodes.length; i++) {
      const code = slotCodes[i];
      await prisma.machineSlot.upsert({
        where: {
          machineId_slotCode: {
            machineId: createdMachine.id,
            slotCode: code,
          },
        },
        update: {
          capacity: 10,
        },
        create: {
          machineId: createdMachine.id,
          slotCode: code,
          slotNumber: i + 1,
          capacity: 10,
          status: "AVAILABLE",
        },
      });
    }
    console.log(`  Seeded 24 slots (A1-F4) with capacity 10 for ${createdMachine.name}`);
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
