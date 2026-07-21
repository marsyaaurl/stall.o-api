import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../middleware/auth.middleware.js";
import { UserRole } from "../../generated/prisma/enums.js";
const router = Router();
router.get("/seller-only", authenticateJWT, authorizeRoles(UserRole.SELLER), (req, res) => {
    res.json({
        message: "Welcome, Seller!",
        user: req.user,
    });
});
router.get("/operator-only", authenticateJWT, authorizeRoles(UserRole.OPERATOR), (req, res) => {
    res.json({
        message: "Welcome, Operator!",
        user: req.user,
    });
});
export default router;
