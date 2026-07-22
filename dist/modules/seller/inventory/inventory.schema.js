import { z } from "zod";
export const getInventoryQuerySchema = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).optional().default(20),
    search: z.string().optional(),
    machineId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    status: z.enum(["AVAILABLE", "EXPIRING_SOON", "SOLD_OUT", "EXPIRED", "LOW_STOCK"]).optional(),
});
