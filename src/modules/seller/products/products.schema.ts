import { z } from "zod";

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).optional().default(20),
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  category: z.enum(["FOOD", "DRINK", "SNACK", "DESSERT", "OTHER"]).optional(),
});

export const expirationPolicySchema = z.object({
  discountEnabled: z.boolean().optional().default(true),
  discountPercentage: z.number().int().min(0).max(100).optional().default(20),
  discountStartHoursBefore: z.number().int().min(0).optional().default(4),
  finalAction: z
    .enum(["SELLER_PICKUP", "DONATE", "DISCARD", "DISCOUNT", "REMOVE"])
    .optional()
    .default("SELLER_PICKUP"),
});

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.enum(["FOOD", "DRINK", "SNACK", "DESSERT", "OTHER"]),
  basePrice: z.number().positive("Base price must be a positive number"),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
  shelfLifeHours: z.number().int().min(1).optional(),
  expirationPolicy: expirationPolicySchema.optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.enum(["FOOD", "DRINK", "SNACK", "DESSERT", "OTHER"]).optional(),
  basePrice: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  shelfLifeHours: z.number().int().min(1).optional(),
  expirationPolicy: expirationPolicySchema.partial().optional(),
});

export const updateProductStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export type GetProductsQuerySchema = z.infer<typeof getProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<typeof updateProductStatusSchema>;