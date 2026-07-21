import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware.js";
import { UserRole } from "../../generated/prisma/enums.js";
import { getSellerDashboardData } from "./seller.service.js";
import { getSellerDashboardQuerySchema } from "./seller.schema.js";
import { SellerModuleError } from "./seller.errors.js";
const router = Router();
router.get("/dashboard", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        // 1. Validate request query parameters using Zod
        const parseResult = getSellerDashboardQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        // 2. Extract seller ID from authenticated JWT token
        const sellerId = req.user.id;
        // 3. Delegate to business logic service
        const dashboardData = await getSellerDashboardData(sellerId);
        // 4. Return successful JSON response
        res.json(dashboardData);
    }
    catch (error) {
        if (error instanceof SellerModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error fetching seller dashboard:", error);
        res.status(500).json({ message: "Failed to fetch seller dashboard data" });
    }
});
export default router;
