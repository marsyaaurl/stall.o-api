import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { createReservationSchema, getReservationsQuerySchema } from "./reservations.schema.js";
import { createSellerReservation, getSellerReservations, cancelSellerReservation, stockSellerReservation, } from "./reservations.service.js";
const router = Router();
// 1. POST /api/seller/reservations (Create reservation)
router.post("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const validatedInput = createReservationSchema.parse(req.body);
        const result = await createSellerReservation(req.user.id, validatedInput);
        res.status(201).json({ message: "Reservation created successfully", data: result });
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to create reservation" });
    }
});
// 2. GET /api/seller/reservations (List seller reservations)
router.get("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const validatedQuery = getReservationsQuerySchema.parse(req.query);
        const result = await getSellerReservations(req.user.id, validatedQuery);
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to fetch reservations" });
    }
});
// 3. PATCH /api/seller/reservations/:reservationId/cancel (Cancel reservation)
router.patch("/:reservationId/cancel", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const result = await cancelSellerReservation(req.user.id, req.params.reservationId);
        res.json({ message: "Reservation cancelled successfully", data: result });
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to cancel reservation" });
    }
});
// 4. PATCH /api/seller/reservations/:reservationId/stock (Mock stock reservation slots)
router.patch("/:reservationId/stock", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const result = await stockSellerReservation(req.user.id, req.params.reservationId);
        res.json({ message: "Slots stocked successfully", data: result });
    }
    catch (err) {
        res.status(400).json({ message: err.message || "Failed to stock slots" });
    }
});
export default router;
