import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { getRevenueQuerySchema, GetRevenueQuerySchema, getSalesQuerySchema, GetSalesQuerySchema, getTopProductsQuerySchema, GetTopProductsQuerySchema, getTransactionsQuerySchema, GetTransactionsQuerySchema } from "./sales.schema.js";
import { getSalesOverview, getRevenueOverTime, getTopProducts, getTransactions } from "./sales.service.js";

const router = Router();

// 1. GET /api/seller/sales/overview
router.get(
    '/overview',
    authenticateJWT,
    authorizeRoles(UserRole.SELLER),
    async (req, res) => {
        try {
            const validatedQuery = getSalesQuerySchema.parse(req.query);
            const result = await getSalesOverview(req.user!.id, validatedQuery);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message || "Failed to fetch sales overview" });
        }
    }
)

// 2. GET /api/seller/sales/revenue
router.get(
    '/revenue',
    authenticateJWT,
    authorizeRoles(UserRole.SELLER),
    async (req, res) => {
        try {
            const validatedQuery = getRevenueQuerySchema.parse(req.query);
            const result = await getRevenueOverTime(req.user!.id, validatedQuery);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message || "Failed to fetch sales overview" });
        }
    }
)

// 3. GET /api/seller/sales/top-products
router.get(
    '/top-products',
    authenticateJWT,
    authorizeRoles(UserRole.SELLER),
    async (req, res) => {
        try {
            const validatedQuery = getTopProductsQuerySchema.parse(req.query);
            const result = await getTopProducts(req.user!.id, validatedQuery);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message || "Failed to fetch sales overview" });
        }
    }
)

// 1. GET /api/seller/sales/transactions
router.get(
    '/transactions',
    authenticateJWT,
    authorizeRoles(UserRole.SELLER),
    async (req, res) => {
        try {
            const validatedQuery = getTransactionsQuerySchema.parse(req.query);
            const result = await getTransactions(req.user!.id, validatedQuery);
            res.json(result);
        } catch (err: any) {
            res.status(400).json({ message: err.message || "Failed to fetch sales overview" });
        }
    }
)

export default router;
