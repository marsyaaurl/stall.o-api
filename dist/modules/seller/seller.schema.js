import { z } from "zod";
// ==========================================
// 1. REQUEST INPUT SCHEMAS (Input Validation)
// ==========================================
// Query parameters for GET /api/seller/dashboard
export const getSellerDashboardQuerySchema = z.object({
    timeframe: z.enum(["today", "week", "month"]).optional().default("today"),
});
// Request Body for POST /api/seller/products
export const createProductSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    description: z.string().optional(),
    imageUrl: z.string().url("Must be a valid image URL").optional(),
    category: z.enum(["FOOD", "DRINK", "SNACK", "DESSERT", "OTHER"]),
    defaultPrice: z.number().positive("Price must be a positive number"),
});
// ==========================================
// 2. RESPONSE PAYLOAD SCHEMAS (Output Contracts)
// ==========================================
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
