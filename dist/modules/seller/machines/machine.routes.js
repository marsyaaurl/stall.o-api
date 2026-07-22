import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { getMachineQuerySchema, getAvailabilityQuerySchema } from "./machine.schema.js";
import { getSellerMachines, getSellerMachineById, getMachineSlotAvailability, } from "./machine.service.js";
const router = Router();
// 1. GET /api/seller/machines (List machines)
router.get("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const query = { ...req.query };
        if (query.status === "" || query.status === "ALL")
            delete query.status;
        if (query.search === "")
            delete query.search;
        const validatedQuery = getMachineQuerySchema.parse(query);
        const result = await getSellerMachines(validatedQuery);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to fetch machines" });
    }
});
// 2. GET /api/seller/machines/:machineId (Get details)
router.get("/:machineId", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const result = await getSellerMachineById(req.params.machineId);
        res.json(result);
    }
    catch (err) {
        res.status(404).json({ message: err.message || "Machine not found" });
    }
});
// 3. GET /api/seller/machines/:machineId/availability (Check availability)
router.get("/:machineId/availability", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const validatedQuery = getAvailabilityQuerySchema.parse({
            machineId: req.params.machineId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        });
        const result = await getMachineSlotAvailability(validatedQuery.machineId, validatedQuery.startDate, validatedQuery.endDate);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to check availability" });
    }
});
export default router;
