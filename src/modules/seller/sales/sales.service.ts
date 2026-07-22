/* getSalesOverview: Sum total revenue, count unique orders, sum total units sold, and average order value.
getRevenueOverTime: Group revenue by day, auto-populating 0-revenue days between startDate and endDate.
getTopProducts: Sort products by total revenue or units sold.
getSalesByMachine: Group sales revenue and orders by vending machine.
getTransactions: Paginated, filterable order transactions list. */

import { prisma } from "../../../config/prisma.js";
import { PaymentStatus } from "../../../generated/prisma/enums.js";
import { GetRevenueQuerySchema, GetSalesQuerySchema, GetTopProductsQuerySchema, GetTransactionsQuerySchema } from "./sales.schema.js";

export async function getSalesOverview(
    sellerId: string,
    query: GetSalesQuerySchema,
) {
    const whereClauseItem: any = {
        productBatch: { sellerId },
        order: {
            paymentStatus: "PAID",
        },
    };

    const whereClauseOrder: any = {
        paymentStatus: "PAID",
        items: {
            some: {
                productBatch: { sellerId },
            },
        },
    };

    if (query.startDate || query.endDate) {
        const dateFilter: any = {};
        if (query.startDate) {
            dateFilter.gte = new Date(`${query.startDate}T00:00:00.000Z`);
        }
        if (query.endDate) {
            dateFilter.lte = new Date(`${query.endDate}T23:59:59.999Z`);
        }
        whereClauseItem.order.createdAt = dateFilter;
        whereClauseOrder.createdAt = dateFilter;
    }

    // Combined aggregate call
    const [salesAgg, orderCount] = await Promise.all([
        prisma.orderItem.aggregate({
            _sum: { subtotal: true, quantity: true },
            where: whereClauseItem,
        }),
        prisma.customerOrder.count({
            where: whereClauseOrder,
        }),
    ]);

    const totalRevenue = Number(salesAgg._sum.subtotal || 0);
    const totalOrders = orderCount;
    const totalUnitsSold = salesAgg._sum.quantity || 0;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
        totalRevenue,
        totalOrders,
        totalUnitsSold,
        averageOrderValue,
    };
}

export async function getRevenueOverTime(
    sellerId: string,
    query: GetRevenueQuerySchema
) {
    const { startDate, endDate } = query;

    const whereClause: any = {
        productBatch: { sellerId },
        order: {
            paymentStatus: "PAID",
        },
    };

    // Calculate dates
    let start: Date;
    let end: Date;

    if (startDate) {
        start = new Date(`${startDate}T00:00:00.000Z`);
    } else {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (endDate) {
        end = new Date(`${endDate}T23:59:59.999Z`);
    } else {
        end = new Date();
    }

    whereClause.order.createdAt = {
        gte: start,
        lte: end,
    };

    const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        include: {
            order: true,
        },
    });

    const revenueMap: { [dateStr: string]: number } = {};

    // Initialize all dates in range to 0 (so there are no gaps in the chart)
    let current = new Date(start);
    while (current <= end) {
        const dateStr = current.toISOString().split("T")[0];
        revenueMap[dateStr] = 0;
        current.setDate(current.getDate() + 1);
    }

    // Add up the daily revenue
    for (const item of orderItems) {
        const dateStr = item.order.createdAt.toISOString().split("T")[0];
        const subtotal = Number(item.subtotal || 0);
        if (dateStr in revenueMap) {
            revenueMap[dateStr] += subtotal;
        } else {
            revenueMap[dateStr] = subtotal;
        }
    }

    // Transform to sorted array
    const revenue = Object.entries(revenueMap)
        .map(([date, amount]) => ({
            date,
            revenue: amount,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return revenue;
}

export async function getTopProducts(
    sellerId: string,
    query: GetTopProductsQuerySchema,
) {
    const { startDate, endDate } = query;

    const whereClause: any = {
        productBatch: { sellerId },
        order: {
            paymentStatus: "PAID",
        }
    };

    // Calculate dates
    let start: Date;
    let end: Date;

    if (startDate) {
        start = new Date(`${startDate}T00:00:00.000Z`);
    } else {
        const d = new Date();
        d.setDate(d.getDate() - 30); // Default to last 30 days
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    if (endDate) {
        end = new Date(`${endDate}T23:59:59.999Z`);
    } else {
        end = new Date();
    }

    whereClause.order.createdAt = {
        gte: start,
        lte: end,
    };

    const orderItems = await prisma.orderItem.findMany({
        where: whereClause,
        include: {
            order: true,
            productBatch: {
                include: {
                    product: true,
                },
            },
        },
    });

    const topProducts = orderItems.reduce(
        (acc, item) => {
            const productId = item.productBatch.productId;
            const productName = item.productBatch.product.name;
            const subtotal = Number(item.subtotal || 0);

            if (!acc[productId]) {
                acc[productId] = {
                    productName,
                    revenue: 0,
                    unitsSold: 0
                };
            }

            acc[productId].revenue += subtotal;
            acc[productId].unitsSold += Number(item.quantity || 0);

            return acc;
        }, {} as Record<
            string,
            { productName: string; revenue: number; unitsSold: number }
        >
    );

    // convert map to array, sort by revenue descending, take limit
    const sortedTopProducts = Object.entries(topProducts)
        .map(([productId, data]) => ({
            productId,
            ...data,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, query.limit || 5);

    return sortedTopProducts;
}

export async function getTransactions(
    sellerId: string,
    query: GetTransactionsQuerySchema
) {
    const { page = 1, limit = 20, productId, machineId, startDate, endDate } = query;

    const whereClause: any = {
        productBatch: { sellerId },
        order: {
            paymentStatus: "PAID",
        }
    };

    // Calculate dates
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
        start = new Date(`${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
        end = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (start || end) {
        const dateFilter: any = {};
        if (start) dateFilter.gte = start;
        if (end) dateFilter.lte = end;
        whereClause.order.createdAt = dateFilter;
    }

    if (productId) {
        whereClause.productBatch.productId = productId;
    }

    if (machineId) {
        whereClause.order.machineId = machineId;
    }

    const [transactions, total] = await Promise.all([
        prisma.orderItem.findMany({
            where: whereClause,
            orderBy: {
                order: {
                    createdAt: "desc"
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            include: {
                productBatch: {
                    include: {
                        product: true,
                    }
                },
                order: {
                    include: {
                        machine: true,
                    }
                }
            }
        }),
        prisma.orderItem.count({
            where: whereClause,
        })
    ]);

    const data = transactions.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productName: item.productBatch.product.name,
        machineName: item.order.machine.name,
        quantity: item.quantity,
        totalAmount: Number(item.subtotal),
        status: item.order.status,
        createdAt: item.order.createdAt.toISOString(),
    }));

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        }
    };
}