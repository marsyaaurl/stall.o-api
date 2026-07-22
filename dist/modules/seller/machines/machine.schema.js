import { z } from "zod";
export const getMachineQuerySchema = z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).optional().default(20),
    search: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "OFFLINE"]).optional(),
});
export const getAvailabilityQuerySchema = z.object({
    machineId: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
});
