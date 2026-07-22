import { prisma } from "../src/config/prisma.js";

async function main() {
  console.log("Cleaning up old enum variants in DB...");
  await prisma.$executeRawUnsafe(`UPDATE "Reservation" SET status = 'COMPLETED' WHERE status = 'APPROVED'`);
  await prisma.$executeRawUnsafe(`UPDATE "Reservation" SET status = 'CANCELLED' WHERE status = 'REJECTED'`);
  console.log("Cleanup finished.");
}

main().finally(() => prisma.$disconnect());
