import { prisma } from "../../../config/prisma.js";
import { ProductNotFoundError } from "./products.error.js";
// 1. Get List of Products (Paginated & Filterable)
export async function getSellerProducts(sellerId, query) {
    const { page = 1, limit = 20, search, status, category } = query;
    const whereCondition = {
        sellerId,
        status: status || undefined,
        category: category || undefined,
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where: whereCondition,
            take: limit,
            skip: (page - 1) * limit,
            include: {
                expirationPolicy: true,
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({
            where: whereCondition,
        }),
    ]);
    return {
        data: products,
        pagination: {
            page,
            limit,
            total,
        },
    };
}
// 2. Get Single Product Details (Product + ExpirationPolicy + InventorySummary + SalesSummary)
export async function getSellerProductById(sellerId, productId) {
    const product = await prisma.product.findFirst({
        where: { id: productId, sellerId },
        include: {
            expirationPolicy: true,
        },
    });
    if (!product) {
        throw new ProductNotFoundError(productId);
    }
    // Calculate live inventory summary (total stock quantity & machine count)
    const inventoryAgg = await prisma.productBatch.aggregate({
        _sum: { remainingQuantity: true },
        where: {
            productId,
            sellerId,
            status: { in: ["ACTIVE", "DISCOUNTED"] },
        },
    });
    const activeMachines = await prisma.productBatch.findMany({
        where: {
            productId,
            sellerId,
            status: { in: ["ACTIVE", "DISCOUNTED"] },
        },
        select: { machineSlotId: true },
        distinct: ["machineSlotId"],
    });
    // Calculate sales summary
    const salesAgg = await prisma.orderItem.aggregate({
        _sum: { quantity: true, subtotal: true },
        where: {
            productBatch: { productId, sellerId },
            order: { paymentStatus: "PAID" },
        },
    });
    const productJson = JSON.parse(JSON.stringify(product));
    return {
        ...productJson,
        inventorySummary: {
            totalQuantity: inventoryAgg._sum.remainingQuantity || 0,
            machineCount: activeMachines.length,
        },
        salesSummary: {
            totalSoldUnits: salesAgg._sum.quantity || 0,
            totalEarnings: Number(salesAgg._sum.subtotal || 0),
        },
    };
}
// 3. Create Product + Nested ExpirationPolicy (Transaction)
export async function createSellerProduct(sellerId, input) {
    const { name, description, imageUrl, category, basePrice, shelfLifeHours, status, expirationPolicy, } = input;
    return prisma.product.create({
        data: {
            sellerId,
            name,
            description,
            imageUrl,
            category,
            defaultPrice: basePrice,
            shelfLifeHours,
            status: status || "ACTIVE",
            expirationPolicy: expirationPolicy
                ? {
                    create: {
                        discountEnabled: expirationPolicy.discountEnabled ?? true,
                        discountPercentage: expirationPolicy.discountPercentage ?? 20,
                        discountStartHoursBefore: expirationPolicy.discountStartHoursBefore ?? 4,
                        finalAction: expirationPolicy.finalAction ?? "SELLER_PICKUP",
                    },
                }
                : undefined,
        },
        include: {
            expirationPolicy: true,
        },
    });
}
// 4. Update Product & ExpirationPolicy in One Unified Function
export async function updateSellerProduct(sellerId, productId, input) {
    // Security ownership check: Verify product belongs to seller
    const existingProduct = await prisma.product.findFirst({
        where: { id: productId, sellerId },
    });
    if (!existingProduct) {
        throw new ProductNotFoundError(productId);
    }
    const { name, description, imageUrl, category, basePrice, shelfLifeHours, status, expirationPolicy, } = input;
    return prisma.product.update({
        where: { id: productId },
        data: {
            name,
            description,
            imageUrl,
            category,
            defaultPrice: basePrice,
            shelfLifeHours,
            status,
            expirationPolicy: expirationPolicy
                ? {
                    upsert: {
                        create: {
                            discountEnabled: expirationPolicy.discountEnabled ?? true,
                            discountPercentage: expirationPolicy.discountPercentage ?? 20,
                            discountStartHoursBefore: expirationPolicy.discountStartHoursBefore ?? 4,
                            finalAction: expirationPolicy.finalAction ?? "SELLER_PICKUP",
                        },
                        update: expirationPolicy,
                    },
                }
                : undefined,
        },
        include: {
            expirationPolicy: true,
        },
    });
}
// 5. Soft Delete Product (Status = INACTIVE)
export async function deleteSellerProduct(sellerId, productId) {
    const existingProduct = await prisma.product.findFirst({
        where: { id: productId, sellerId },
    });
    if (!existingProduct) {
        throw new ProductNotFoundError(productId);
    }
    return prisma.product.delete({
        where: { id: productId },
    });
}
