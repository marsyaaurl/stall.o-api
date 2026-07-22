import { prisma } from "../../../config/prisma.js";
import { CreateReservationSchema, GetReservationsQuerySchema } from "./reservations.schema.js";

export async function createSellerReservation(sellerId: string, input: CreateReservationSchema) {
  const { machineId, slotIds, productId, startDate, endDate, expectedDailyQuantity } = input;

  if (startDate >= endDate) {
    throw new Error("Start date must be before end date");
  }

  const machineSlots = await prisma.machineSlot.findMany({
    where: {
      machineId,
      slotCode: { in: slotIds },
    },
  });

  if (machineSlots.length !== slotIds.length) {
    throw new Error("Some selected slots do not exist on this machine");
  }

  const overlapping = await prisma.reservation.findMany({
    where: {
      machineId,
      status: { in: ["PENDING", "COMPLETED"] },
      startTime: { lte: endDate },
      endTime: { gte: startDate },
      slots: {
        some: {
          machineSlot: { slotCode: { in: slotIds } },
        },
      },
    },
  });

  if (overlapping.length > 0) {
    throw new Error("One or more selected slots are already reserved for this date period");
  }

  const code = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.create({
      data: {
        reservationCode: code,
        sellerId,
        machineId,
        productId,
        expectedDailyQuantity,
        reservationDate: new Date(),
        startTime: startDate,
        endTime: endDate,
        status: "PENDING",
      },
    });

    const slotCreateData = machineSlots.map((ms) => ({
      reservationId: reservation.id,
      machineSlotId: ms.id,
    }));

    await tx.reservationSlot.createMany({
      data: slotCreateData,
    });

    return reservation;
  });
}

export async function getSellerReservations(sellerId: string, query: GetReservationsQuerySchema) {
  const { page = 1, limit = 20, status } = query;

  const where: any = { sellerId };
  if (status) {
    where.status = status;
  }

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        machine: { select: { name: true } },
        product: { select: { name: true } },
        slots: {
          include: {
            machineSlot: { select: { slotCode: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reservation.count({ where }),
  ]);

  const formatted = reservations.map((res) => ({
    id: res.id,
    reservationCode: res.reservationCode,
    machine: { name: res.machine.name },
    product: res.product ? { name: res.product.name } : null,
    slots: res.slots.map((s) => s.machineSlot.slotCode),
    startDate: res.startTime,
    endDate: res.endTime,
    status: res.status,
  }));

  return {
    data: formatted,
    pagination: { page, limit, total },
  };
}

export async function cancelSellerReservation(sellerId: string, reservationId: string) {
  const res = await prisma.reservation.findFirst({
    where: { id: reservationId, sellerId },
  });

  if (!res) {
    throw new Error("Reservation not found");
  }

  return prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });
}

export async function stockSellerReservation(sellerId: string, reservationId: string) {
  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, sellerId },
    include: {
      product: true,
      slots: {
        include: { machineSlot: true },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  if (reservation.status !== "PENDING") {
    throw new Error("Reservation is not in pending state");
  }

  if (!reservation.productId) {
    throw new Error("No product associated with this reservation");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "COMPLETED" },
    });

    const now = new Date();

    for (const slot of reservation.slots) {
      const shelfLifeHours = reservation.product?.shelfLifeHours;
      const expiresAt = shelfLifeHours
        ? new Date(now.getTime() + shelfLifeHours * 60 * 60 * 1000)
        : reservation.endTime;

      const batchCode = `BATCH-${reservation.reservationCode}-${slot.machineSlot.slotCode}`;

      await tx.productBatch.upsert({
        where: { batchCode },
        update: {
          remainingQuantity: reservation.expectedDailyQuantity ?? 10,
          quantity: reservation.expectedDailyQuantity ?? 10,
          status: "ACTIVE",
          expiresAt,
        },
        create: {
          batchCode,
          productId: reservation.productId!,
          sellerId,
          reservationId,
          machineSlotId: slot.machineSlotId,
          quantity: reservation.expectedDailyQuantity ?? 10,
          remainingQuantity: reservation.expectedDailyQuantity ?? 10,
          price: reservation.product!.defaultPrice,
          originalPrice: reservation.product!.defaultPrice,
          expiresAt,
          status: "ACTIVE",
        },
      });

      await tx.machineSlot.update({
        where: { id: slot.machineSlotId },
        data: { status: "OCCUPIED" },
      });
    }

    return updated;
  });
}
