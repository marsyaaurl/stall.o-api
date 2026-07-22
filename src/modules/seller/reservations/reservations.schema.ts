import { z } from "zod";

export const createReservationSchema = z.object({
  machineId: z.string().uuid("Invalid machine ID"),
  slotIds: z.array(z.string()).min(1, "At least one slot must be selected"),
  productId: z.string().uuid("Invalid product ID"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  expectedDailyQuantity: z.coerce.number().int().min(1).default(10),
});

export const getReservationsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).optional().default(20),
  status: z.enum(["PENDING", "CANCELLED", "COMPLETED"]).optional(),
});

export type CreateReservationSchema = z.infer<typeof createReservationSchema>;
export type GetReservationsQuerySchema = z.infer<typeof getReservationsQuerySchema>;
