import { Router } from "express";
import { getProductsQuerySchema, createOrderSchema, pickupCodeSchema } from "./customer.schema.js";
import {
    getMachineByCode,
    getMachineProducts,
    getProductDetail,
    createCustomerOrder,
    claimPickupCode
} from "./customer.service.js";

const router = Router();

// 1. GET /api/customer/machines/:machineCode
router.get("/machines/:machineCode", async (req, res) => {
    try {
        const { machineCode } = req.params;
        const result = await getMachineByCode(machineCode);
        if (!result) {
            return res.status(404).json({ message: "Vending machine not found" });
        }
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message || "Failed to fetch machine details" });
    }
});

// 2. GET /api/customer/machines/:machineId/products
router.get("/machines/:machineId/products", async (req, res) => {
    try {
        const { machineId } = req.params;
        const parsedQuery = getProductsQuerySchema.parse(req.query);
        const result = await getMachineProducts(machineId, parsedQuery);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message || "Failed to fetch machine products" });
    }
});

// 3. GET /api/customer/machines/:machineId/products/:productId
router.get("/machines/:machineId/products/:productId", async (req, res) => {
    try {
        const { machineId, productId } = req.params;
        const result = await getProductDetail(machineId, productId);
        res.json(result);
    } catch (err: any) {
        res.status(404).json({ message: err.message || "Product not found inside this machine" });
    }
});

// 4. POST /api/customer/orders
router.post("/orders", async (req, res) => {
    try {
        const parsedBody = createOrderSchema.parse(req.body);
        const result = await createCustomerOrder(parsedBody);
        res.status(201).json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message || "Failed to create customer order" });
    }
});

// 5. POST /api/customer/orders/pickup
router.post("/orders/pickup", async (req, res) => {
    try {
        const parsedBody = pickupCodeSchema.parse(req.body);
        const result = await claimPickupCode(parsedBody.pickupCode);
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ message: err.message || "Invalid or expired pickup ticket code" });
    }
});

export default router;
