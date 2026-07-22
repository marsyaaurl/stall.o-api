import { Router } from "express";
import { authenticateJWT, authorizeRoles } from "../../../middleware/auth.middleware.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { getProductsQuerySchema, createProductSchema, updateProductSchema, } from "./products.schema.js";
import { ProductModuleError, ProductNotFoundError } from "./products.error.js";
import { getSellerProducts, getSellerProductById, createSellerProduct, updateSellerProduct, deleteSellerProduct, } from "./products.service.js";
const router = Router();
// 1. GET /api/seller/products (List products with query filters)
router.get("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const parseResult = getProductsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const sellerId = req.user.id;
        const productsData = await getSellerProducts(sellerId, parseResult.data);
        res.json(productsData);
    }
    catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error fetching seller products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
});
// 2. GET /api/seller/products/:productId (Get product details + summaries)
router.get("/:productId", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const sellerId = req.user.id;
        const productId = req.params.productId;
        if (!productId) {
            res.status(400).json({ message: "Product ID is required" });
            return;
        }
        const product = await getSellerProductById(sellerId, productId);
        res.json(product);
    }
    catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error fetching product details:", error);
        res.status(500).json({ message: "Failed to fetch product details" });
    }
});
// 3. POST /api/seller/products (Create product + nested ExpirationPolicy)
router.post("/", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const parseResult = createProductSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const sellerId = req.user.id;
        const newProduct = await createSellerProduct(sellerId, parseResult.data);
        res.status(201).json(newProduct);
    }
    catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Failed to create product" });
    }
});
// 4. PATCH /api/seller/products/:productId (Update product details & expiration policy)
router.patch("/:productId", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const parseResult = updateProductSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation failed",
                errors: parseResult.error.flatten().fieldErrors,
            });
            return;
        }
        const sellerId = req.user.id;
        const productId = req.params.productId;
        const updatedProduct = await updateSellerProduct(sellerId, productId, parseResult.data);
        res.json(updatedProduct);
    }
    catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Failed to update product" });
    }
});
// 5. DELETE /api/seller/products/:productId (Delete product)
router.delete("/:productId", authenticateJWT, authorizeRoles(UserRole.SELLER), async (req, res) => {
    try {
        const sellerId = req.user.id;
        const productId = req.params.productId;
        const deletedProduct = await deleteSellerProduct(sellerId, productId);
        res.json({
            message: "Product deleted successfully",
            product: deletedProduct,
        });
    }
    catch (error) {
        if (error instanceof ProductNotFoundError || error instanceof ProductModuleError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
});
export default router;
