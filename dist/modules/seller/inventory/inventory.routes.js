import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { getInventoryQuerySchema } from "./inventory.schema.js";
import { getSellerInventory } from "./inventory.service.js";
const router = Router();
// GET /api/seller/inventory (Get current inventory)
router.get("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const query = { ...req.query };
        if (query.machineId === "" || query.machineId === "ALL")
            delete query.machineId;
        if (query.productId === "" || query.productId === "ALL")
            delete query.productId;
        if (query.status === "" || query.status === "ALL")
            delete query.status;
        if (query.search === "")
            delete query.search;
        const validatedQuery = getInventoryQuerySchema.parse(query);
        const result = await getSellerInventory(req.user.id, validatedQuery);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to fetch inventory" });
    }
});
export default router;
