import { z } from "zod";

export const getProductsQuerySchema = z.object({
    search: z.string().optional(),
    category: z.enum(["FOOD", "DRINK", "SNACK", "DESSERT", "OTHER"]).optional(),
})

export const createOrderSchema = z.object({
    machineId: z.string(),
    items: z.array(z.object({
        productBatchId: z.string(),
        quantity: z.number().int().positive(),
    }))
})

export const pickupCodeSchema = z.object({
    pickupCode: z.string()
})

export type GetProductsQuerySchema = z.infer<typeof getProductsQuerySchema>
export type CreateOrderSchema = z.infer<typeof createOrderSchema>
export type PickupCodeSchema = z.infer<typeof pickupCodeSchema>
