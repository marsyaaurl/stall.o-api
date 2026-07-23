import { prisma } from "../../../config/prisma.js";
import { cleanupExpiredBatches } from "../inventory/inventory.service.js";

export async function getSellerDashboardData(sellerId: string) {
  await cleanupExpiredBatches();

  const now = new Date();
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const sixtyMinutesFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    activeProductsCount,
    productsInMachinesAgg,
    todaySalesAgg,
    expiringSoonCount,
    expiringBatches,
    startingReservations,
    activeReservations,
    inventory,
    recentSalesItems,
  ] = await Promise.all([
    // 1. Active Products Count
    prisma.product.count({
      where: { sellerId },
    }),

    // 2. Products In Machines (Remaining Quantity Sum)
    prisma.productBatch.aggregate({
      _sum: { remainingQuantity: true },
      where: {
        sellerId,
        status: { in: ["ACTIVE", "DISCOUNTED"] },
      },
    }),

    // 3. Today's Sales
    prisma.orderItem.aggregate({
      _sum: { subtotal: true },
      where: {
        productBatch: { sellerId },
        order: {
          paymentStatus: "PAID",
          createdAt: { gte: startOfDay },
        },
      },
    }),

    // 4. Expiring Soon Count (within 4 hours)
    prisma.productBatch.count({
      where: {
        sellerId,
        status: { in: ["ACTIVE", "DISCOUNTED"] },
        expiresAt: { gte: now, lte: fourHoursFromNow },
      },
    }),

    // 5a. Expiring Batches for Action Required
    prisma.productBatch.findMany({
      where: {
        sellerId,
        status: { in: ["ACTIVE", "DISCOUNTED"] },
        expiresAt: { gte: now, lte: fourHoursFromNow },
      },
      include: { product: true },
      take: 5,
    }),

    // 5b. Reservations Starting Soon for Action Required
    prisma.reservation.findMany({
      where: {
        sellerId,
        status: "PENDING",
        startTime: { gte: now, lte: sixtyMinutesFromNow },
      },
      include: { machine: true },
      take: 5,
    }),

    // 6. Active Reservations
    prisma.reservation.findMany({
      where: {
        sellerId,
        status: { in: ["PENDING", "COMPLETED"] },
      },
      include: {
        machine: true,
        slots: {
          include: { machineSlot: true },
        },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    }),

    // 7. Inventory Preview
    prisma.productBatch.findMany({
      where: {
        sellerId,
        status: { in: ["ACTIVE", "DISCOUNTED"] },
      },
      include: {
        product: true,
        machineSlot: {
          include: { machine: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    // 8. Recent Sales
    prisma.orderItem.findMany({
      where: {
        productBatch: { sellerId },
      },
      include: {
        productBatch: {
          include: { product: true },
        },
        order: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Build Action Required Array
  const actionRequired: Array<{ type: string; message: string }> = [];

  expiringBatches.forEach((batch) => {
    const hoursLeft = Math.max(
      0,
      Math.round((batch.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
    );
    actionRequired.push({
      type: "EXPIRING_PRODUCT",
      message: `${batch.product.name} (Batch ${batch.batchCode}) expires in ${hoursLeft} hours`,
    });
  });

  startingReservations.forEach((res) => {
    const minsLeft = Math.max(
      0,
      Math.round((res.startTime.getTime() - now.getTime()) / (1000 * 60))
    );
    actionRequired.push({
      type: "RESERVATION_STARTING",
      message: `Your reservation at ${res.machine.name} starts in ${minsLeft} minutes`,
    });
  });

  return {
    summary: {
      activeProducts: activeProductsCount,
      productsInMachines: productsInMachinesAgg._sum.remainingQuantity || 0,
      todaySales: Number(todaySalesAgg._sum.subtotal || 0),
      expiringSoon: expiringSoonCount,
    },
    actionRequired,
    activeReservations,
    inventory,
    recentSales: recentSalesItems,
  };
}
