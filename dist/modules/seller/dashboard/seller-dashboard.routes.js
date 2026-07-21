import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { getSellerDashboardData } from "./seller-dashboard.service.js";
import { getSellerDashboardQuerySchema } from "./seller-dashboard.schema.js";
import { SellerDashboardError } from "./seller-dashboard.errors.js";
const router = Router();
router.get("/dashboard", authenticateJWT, authorizeRoles(UserRole.SELLER, UserRole.ADMIN), async (req, res) => {
    try {
        const parseResult = getSellerDashboardQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const sellerId = req.user.id;
        const dashboardData = await getSellerDashboardData(sellerId);
        res.json(dashboardData);
    }
    catch (error) {
        if (error instanceof SellerDashboardError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error fetching seller dashboard:", error);
        res.status(500).json({ message: "Failed to fetch seller dashboard data" });
    }
});
export default router;
