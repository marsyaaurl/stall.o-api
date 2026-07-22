import { prisma } from "../../../config/prisma.js";
import { GetMachineQuerySchema } from "./machine.schema.js";

export async function getSellerMachines(query: GetMachineQuerySchema) {
  const { page = 1, limit = 12, search, status } = query;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { locationName: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  const [machines, total] = await Promise.all([
    prisma.vendingMachine.findMany({
      where,
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: { select: { slots: true } },
        slots: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vendingMachine.count({ where }),
  ]);

  const formattedData = machines.map((m) => {
    const totalSlots = m._count.slots;
    const availableSlots = m.slots.filter((s) => s.status === "AVAILABLE").length;
    return {
      id: m.id,
      name: m.name,
      locationName: m.locationName,
      address: m.address,
      status: m.status,
      totalSlots,
      availableSlots,
    };
  });

  return {
    data: formattedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getSellerMachineById(machineId: string) {
  const machine = await prisma.vendingMachine.findFirst({
    where: { id: machineId },
    include: {
      slots: { orderBy: { slotNumber: "asc" } },
    },
  });

  if (!machine) {
    throw new Error("Vending machine not found");
  }

  return {
    id: machine.id,
    name: machine.name,
    status: machine.status,
    locationName: machine.locationName,
    address: machine.address,
    slots: machine.slots.map((s) => ({
      id: s.id,
      code: s.slotCode,
      status: s.status,
    })),
  };
}

export async function getMachineSlotAvailability(
  machineId: string,
  startDate: Date,
  endDate: Date
) {
  const slots = await prisma.machineSlot.findMany({
    where: { machineId },
    orderBy: { slotNumber: "asc" },
  });

  const reservations = await prisma.reservation.findMany({
    where: {
      machineId,
      status: { in: ["PENDING", "COMPLETED"] },
      startTime: { lte: endDate },
      endTime: { gte: startDate },
    },
    include: {
      slots: {
        include: { machineSlot: true },
      },
    },
  });

  const occupiedSlotCodes = new Set<string>();
  for (const res of reservations) {
    for (const resSlot of res.slots) {
      occupiedSlotCodes.add(resSlot.machineSlot.slotCode);
    }
  }

  const mappedSlots = slots.map((s) => ({
    id: s.id,
    code: s.slotCode,
    status: occupiedSlotCodes.has(s.slotCode) ? "OCCUPIED" : "AVAILABLE",
  }));

  return {
    machineId,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    slots: mappedSlots,
  };
}