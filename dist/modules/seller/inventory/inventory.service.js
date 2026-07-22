import { prisma } from "../../../config/prisma.js";
export async function getSellerInventory(sellerId, query) {
    const { search, machineId, productId, status, page = 1, limit = 20 } = query;
    const now = new Date();
    const expiringLimit = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    // 1. Build DB filter
    const where = { sellerId };
    if (machineId) {
        where.machineSlot = { machineId };
    }
    if (productId) {
        where.productId = productId;
    }
    if (search) {
        where.product = {
            name: { contains: search, mode: "insensitive" },
        };
    }
    // 2. Fetch all matching batches for this seller to calculate summary and filter status correctly
    const allBatches = await prisma.productBatch.findMany({
        where,
        include: {
            product: {
                select: { name: true, category: true, imageUrl: true },
            },
            machineSlot: {
                include: {
                    machine: { select: { name: true } },
                },
            },
        },
        orderBy: { expiresAt: "asc" },
    });
    // Helper to determine status
    const getItemStatus = (batch) => {
        if (batch.remainingQuantity === 0)
            return "SOLD_OUT";
        if (batch.expiresAt < now)
            return "EXPIRED";
        if (batch.expiresAt <= expiringLimit)
            return "EXPIRING_SOON";
        if (batch.remainingQuantity <= 2)
            return "LOW_STOCK";
        return "AVAILABLE";
    };
    // 3. Compute Summary from matching data
    let totalUnits = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    const mappedItems = allBatches.map((b) => {
        const itemStatus = getItemStatus(b);
        totalUnits += b.remainingQuantity;
        if (b.remainingQuantity > 0 && b.remainingQuantity <= 2) {
            lowStockCount++;
        }
        if (b.remainingQuantity > 0 && b.expiresAt >= now && b.expiresAt <= expiringLimit) {
            expiringSoonCount++;
        }
        return {
            id: b.id,
            batchCode: b.batchCode,
            product: {
                name: b.product.name,
                imageUrl: b.product.imageUrl,
                category: b.product.category,
            },
            machine: {
                name: b.machineSlot.machine.name,
            },
            slot: b.machineSlot.slotCode,
            quantity: b.remainingQuantity,
            originalQuantity: b.quantity,
            expiresAt: b.expiresAt,
            status: itemStatus,
        };
    });
    // 4. Filter by status in memory if specified
    const filteredItems = status ? mappedItems.filter((item) => item.status === status) : mappedItems;
    // 5. Paginate in memory
    const total = filteredItems.length;
    const startIndex = (page - 1) * limit;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + limit);
    return {
        data: paginatedItems,
        summary: {
            totalUnits,
            lowStockCount,
            expiringSoonCount,
        },
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
