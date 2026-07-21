import { z } from "zod";
// Query parameters for GET /api/seller/dashboard
export const getSellerDashboardQuerySchema = z.object({
    timeframe: z.enum(["today", "week", "month"]).optional().default("today"),
});
export const sellerDashboardSummarySchema = z.object({
    activeProducts: z.number(),
    productsInMachines: z.number(),
    todaySales: z.number(),
    expiringSoon: z.number(),
});
export const actionRequiredItemSchema = z.object({
    type: z.string(),
    message: z.string(),
});
export const sellerDashboardResponseSchema = z.object({
    summary: sellerDashboardSummarySchema,
    actionRequired: z.array(actionRequiredItemSchema),
    activeReservations: z.array(z.any()),
    inventory: z.array(z.any()),
    recentSales: z.array(z.any()),
});
