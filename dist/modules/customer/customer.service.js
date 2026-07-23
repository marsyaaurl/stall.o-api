import { prisma } from "../../config/prisma.js";
export async function getMachineByCode(machineCode) {
    return await prisma.vendingMachine.findUnique({
        where: { machineCode },
    });
}
export async function getMachineProducts(machineId, filters) {
    const whereClause = {
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
        remainingQuantity: { gt: 0 },
        machineSlot: {
            machineId: machineId,
        },
    };
    if (filters.category) {
        whereClause.product = {
            category: filters.category,
        };
    }
    if (filters.search) {
        whereClause.product = {
            ...whereClause.product,
            name: {
                contains: filters.search,
                mode: "insensitive",
            },
        };
    }
    const batches = await prisma.productBatch.findMany({
        where: whereClause,
        include: {
            product: {
                include: {
                    seller: {
                        include: {
                            sellerProfile: true,
                        },
                    },
                },
            },
        },
    });
    const productsMap = {};
    for (const batch of batches) {
        const p = batch.product;
        if (!productsMap[p.id]) {
            productsMap[p.id] = {
                id: p.id,
                name: p.name,
                imageUrl: p.imageUrl,
                price: Number(batch.price),
                stock: 0,
                category: p.category,
                seller: {
                    name: p.seller.sellerProfile?.businessName || p.seller.name,
                },
            };
        }
        productsMap[p.id].stock += batch.remainingQuantity;
        if (Number(batch.price) < productsMap[p.id].price) {
            productsMap[p.id].price = Number(batch.price);
        }
    }
    return Object.values(productsMap);
}
export async function getProductDetail(machineId, productId) {
    const batches = await prisma.productBatch.findMany({
        where: {
            productId,
            status: "ACTIVE",
            expiresAt: { gt: new Date() },
            remainingQuantity: { gt: 0 },
            machineSlot: { machineId },
        },
        include: {
            product: {
                include: {
                    seller: {
                        include: {
                            sellerProfile: true,
                        },
                    },
                },
            },
            machineSlot: {
                include: {
                    machine: true,
                },
            },
        },
    });
    if (batches.length === 0) {
        throw new Error("Product not available in this machine");
    }
    const firstBatch = batches[0];
    const totalStock = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
    const minPrice = Math.min(...batches.map((b) => Number(b.price)));
    return {
        id: firstBatch.product.id,
        name: firstBatch.product.name,
        description: firstBatch.product.description,
        imageUrl: firstBatch.product.imageUrl,
        price: minPrice,
        stock: totalStock,
        seller: {
            name: firstBatch.product.seller.sellerProfile?.businessName || firstBatch.product.seller.name,
        },
        machine: {
            name: firstBatch.machineSlot.machine.name,
        },
    };
}
export async function createCustomerOrder(data) {
    const { machineId, items } = data;
    return await prisma.$transaction(async (tx) => {
        let totalAmount = 0;
        const orderItemsToCreate = [];
        // Loop through each requested item
        for (const reqItem of items) {
            const { productBatchId: productId, quantity: requestedQty } = reqItem;
            // 1. Fetch unexpired batches for this product in this machine (FIFO order)
            const activeBatches = await tx.productBatch.findMany({
                where: {
                    productId,
                    status: "ACTIVE",
                    expiresAt: { gt: new Date() },
                    remainingQuantity: { gt: 0 },
                    machineSlot: { machineId },
                },
                orderBy: { expiresAt: "asc" },
            });
            // 2. Count total available stock
            const totalAvailable = activeBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
            if (totalAvailable < requestedQty) {
                throw new Error(`Insufficient stock for product ID: ${productId}`);
            }
            // 3. Deplete stock (FIFO loop)
            let qtyRemainingToDeduct = requestedQty;
            for (const batch of activeBatches) {
                if (qtyRemainingToDeduct <= 0)
                    break;
                const deductAmount = Math.min(batch.remainingQuantity, qtyRemainingToDeduct);
                qtyRemainingToDeduct -= deductAmount;
                // Update batch stock in database
                await tx.productBatch.update({
                    where: { id: batch.id },
                    data: {
                        remainingQuantity: {
                            decrement: deductAmount,
                        },
                    },
                });
                orderItemsToCreate.push({
                    productBatchId: batch.id,
                    quantity: deductAmount,
                    unitPrice: batch.price,
                    subtotal: Number(batch.price) * deductAmount,
                });
                totalAmount += Number(batch.price) * deductAmount;
            }
        }
        // 4. Generate random unique 6-digit pickup code
        let pickupCode = "";
        let isCodeUnique = false;
        while (!isCodeUnique) {
            pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
            const existingCode = await tx.pickupCode.findUnique({
                where: { code: pickupCode },
            });
            if (!existingCode)
                isCodeUnique = true;
        }
        // 5. Create CustomerOrder
        const order = await tx.customerOrder.create({
            data: {
                orderCode: `ORD-${Date.now().toString().slice(-6)}`,
                machineId,
                totalAmount,
                status: "READY_FOR_PICKUP",
                paymentStatus: "PAID",
                items: {
                    create: orderItemsToCreate,
                },
            },
        });
        // 6. Save PickupCode
        await tx.pickupCode.create({
            data: {
                orderId: order.id,
                code: pickupCode,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire in 24h
            },
        });
        return {
            orderId: order.id,
            pickupCode,
            totalAmount,
        };
    });
}
export async function claimPickupCode(pickupCode) {
    return await prisma.$transaction(async (tx) => {
        // 1. Find pickup code and verify it is unused and not expired
        const codeRecord = await tx.pickupCode.findFirst({
            where: {
                code: pickupCode,
                status: "UNUSED",
                expiresAt: { gt: new Date() },
            },
            include: {
                order: {
                    include: {
                        items: {
                            include: {
                                productBatch: {
                                    include: {
                                        product: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!codeRecord) {
            throw new Error("INVALID OR EXPIRED CODE");
        }
        // 2. Mark code as USED
        await tx.pickupCode.update({
            where: { id: codeRecord.id },
            data: {
                status: "USED",
                usedAt: new Date(),
            },
        });
        // 3. Mark order as COMPLETED
        await tx.customerOrder.update({
            where: { id: codeRecord.orderId },
            data: {
                status: "COMPLETED",
            },
        });
        // 4. Summarize items to return to dispenser
        const dispensedItems = codeRecord.order.items.map((item) => ({
            name: item.productBatch.product.name,
            quantity: item.quantity,
        }));
        return {
            success: true,
            items: dispensedItems,
        };
    });
}
