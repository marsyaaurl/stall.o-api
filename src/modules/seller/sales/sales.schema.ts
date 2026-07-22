import { z } from "zod";

export const getSalesQuerySchema = z.object({
    startDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
        .optional(),
    endDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
        .optional(),
});

export const getRevenueQuerySchema = getSalesQuerySchema.extend({
    groupBy: z.enum(["DAY", "WEEK", "MONTH"]).optional().default("DAY"),
});

export const getTopProductsQuerySchema = getSalesQuerySchema.extend({
    limit: z.coerce.number().int().min(1).optional().default(5),
});

export const getTransactionsQuerySchema = getSalesQuerySchema.extend({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).optional().default(20),
    productId: z.string().uuid("Invalid product ID").optional(),
    machineId: z.string().uuid("Invalid machine ID").optional(),
});

export type GetSalesQuerySchema = z.infer<typeof getSalesQuerySchema>;
export type GetRevenueQuerySchema = z.infer<typeof getRevenueQuerySchema>;
export type GetTopProductsQuerySchema = z.infer<typeof getTopProductsQuerySchema>;
export type GetTransactionsQuerySchema = z.infer<typeof getTransactionsQuerySchema>;
