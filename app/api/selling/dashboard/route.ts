import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import Order from "@/models/Order";
import mongoose from "mongoose";

// ── Server-side In-Memory Cache ────────────────────────────────────────────────
// Key: `${gymId}:${period}` | TTL: 2 minutes
const CACHE_TTL_MS = 2 * 60 * 1000;

interface CacheEntry {
    data: any;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(key: string): any | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: any): void {
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.PRODUCTS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    // ── Period Filtering ──────────────────────────────────────────────────────
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "month";
    const forceRefresh = url.searchParams.get("refresh") === "1";

    // ── Cache Check ───────────────────────────────────────────────────────────
    const cacheKey = `${session.user.gymId}:${period}`;
    if (!forceRefresh) {
        const cached = getCached(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: {
                    "X-Cache": "HIT",
                    "X-Cache-TTL": String(Math.round((cache.get(cacheKey)!.expiresAt - Date.now()) / 1000)),
                },
            });
        }
    }

    const now = new Date();

    const getPeriodStart = (p: string): Date | null => {
        if (p === "today") {
            const d = new Date(now);
            d.setHours(0, 0, 0, 0);
            return d;
        }
        if (p === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (p === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return null; // "all"
    };

    const periodStart = getPeriodStart(period);
    let prevStart: Date | null = null;
    if (periodStart) {
        const diff = now.getTime() - periodStart.getTime();
        prevStart = new Date(periodStart.getTime() - diff);
    }
    const prevPeriodEnd = periodStart;

    // ⚠️ CRITICAL FIX: Convert gymId string → ObjectId for aggregation pipeline $match
    const gymId = new mongoose.Types.ObjectId(session.user.gymId);

    // Mongoose find/countDocuments auto-cast strings, but aggregate does NOT
    const gymIdStr = session.user.gymId; // used only for find/countDocuments

    const periodDateFilter = periodStart ? { $gte: periodStart } : undefined;
    const prevDateFilter = prevStart && prevPeriodEnd
        ? { $gte: prevStart, $lt: prevPeriodEnd }
        : undefined;

    try {
        await connectDB();

        // ── 1. Products (find/count — string gymId is fine here) ──────────────
        const totalProducts = await Product.countDocuments({ gymId: gymIdStr, status: "active" });

        const lowStockItems = await Product.countDocuments({
            gymId: gymIdStr,
            status: "active",
            trackInventory: true,
            $expr: { $and: [{ $lte: ["$stockQuantity", "$lowStockThreshold"] }, { $gt: ["$stockQuantity", 0] }] }
        });

        const outOfStockItems = await Product.countDocuments({
            gymId: gymIdStr,
            status: "active",
            trackInventory: true,
            stockQuantity: 0
        });

        const inventoryAlerts = await Product.find({
            gymId: gymIdStr,
            status: "active",
            trackInventory: true,
            $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] }
        })
            .select("name stockQuantity lowStockThreshold sku thumbnail price")
            .sort({ stockQuantity: 1 })
            .limit(8)
            .lean();

        // ── 2. All-Time Totals (aggregation — needs ObjectId gymId) ───────────
        const allTimeAgg = await Order.aggregate([
            { $match: { gymId, status: "completed" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$finalAmount" },
                    totalOrders: { $sum: 1 },
                    totalUnitsSold: { $sum: { $sum: "$items.quantity" } },
                    totalDiscount: { $sum: "$discountAmount" },
                }
            }
        ]);

        const totalRevenue = allTimeAgg[0]?.totalRevenue || 0;
        const totalOrders = allTimeAgg[0]?.totalOrders || 0;
        const totalUnitsSold = allTimeAgg[0]?.totalUnitsSold || 0;
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        // ── 3. Pending / Cancelled (countDocuments — string is fine) ─────────
        const cancelledOrders = await Order.countDocuments({ gymId: gymIdStr, status: { $in: ["cancelled", "refunded"] } });
        const pendingOrders = await Order.countDocuments({ gymId: gymIdStr, status: "pending" });

        // ── 4. Period Stats ───────────────────────────────────────────────────
        const periodMatchStage: any = { gymId, status: "completed" };
        if (periodDateFilter) periodMatchStage.createdAt = periodDateFilter;

        const prevMatchStage: any = { gymId, status: "completed" };
        if (prevDateFilter) prevMatchStage.createdAt = prevDateFilter;

        const currentPeriodAgg = await Order.aggregate([
            { $match: periodMatchStage },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$finalAmount" },
                    orders: { $sum: 1 },
                    unitsSold: { $sum: { $sum: "$items.quantity" } }
                }
            }
        ]);

        const prevPeriodAgg = prevStart ? await Order.aggregate([
            { $match: prevMatchStage },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: "$finalAmount" },
                    orders: { $sum: 1 }
                }
            }
        ]) : [];

        const currentRev = currentPeriodAgg[0]?.revenue || 0;
        const prevRev = prevPeriodAgg[0]?.revenue || 0;
        const currentOrd = currentPeriodAgg[0]?.orders || 0;
        const prevOrd = prevPeriodAgg[0]?.orders || 0;
        const periodUnitsSold = currentPeriodAgg[0]?.unitsSold || 0;
        const periodAvgOrderValue = currentOrd > 0 ? Math.round(currentRev / currentOrd) : 0;

        const calculateTrend = (current: number, prev: number) => {
            if (prev === 0 && current === 0) return "+0%";
            if (prev === 0) return "+100%";
            const diff = ((current - prev) / prev) * 100;
            return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
        };

        const revenueTrend = calculateTrend(currentRev, prevRev);
        const ordersTrend = calculateTrend(currentOrd, prevOrd);

        // ── 5. Daily Revenue Chart (always last 30 days for the chart) ────────
        const chartStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyRevAgg = await Order.aggregate([
            { $match: { gymId, status: "completed", createdAt: { $gte: chartStart } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$finalAmount" },
                    orders: { $sum: 1 },
                    unitsSold: { $sum: { $sum: "$items.quantity" } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Fill gaps with zeros
        const revenueChart: { date: string; revenue: number; orders: number; unitsSold: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split("T")[0];
            const found = dailyRevAgg.find((x: any) => x._id === key);
            revenueChart.push({
                date: key,
                revenue: found?.revenue || 0,
                orders: found?.orders || 0,
                unitsSold: found?.unitsSold || 0,
            });
        }

        // ── 6. Revenue by Source ──────────────────────────────────────────────
        const sourceAgg = await Order.aggregate([
            { $match: periodMatchStage },
            { $group: { _id: "$source", revenue: { $sum: "$finalAmount" }, orders: { $sum: 1 } } }
        ]);

        const revenueBySource = {
            pos: sourceAgg.find((x: any) => x._id === "pos")?.revenue || 0,
            memberPortal: sourceAgg.find((x: any) => x._id === "member_portal")?.revenue || 0,
            externalApi: sourceAgg.find((x: any) => x._id === "external_api")?.revenue || 0,
        };

        // ── 7. Revenue by Payment Method ──────────────────────────────────────
        const paymentAgg = await Order.aggregate([
            { $match: periodMatchStage },
            { $group: { _id: "$paymentMethod", revenue: { $sum: "$finalAmount" }, orders: { $sum: 1 } } }
        ]);

        const revenueByPaymentMethod = {
            cash: paymentAgg.find((x: any) => x._id === "cash")?.revenue || 0,
            card: paymentAgg.find((x: any) => x._id === "card")?.revenue || 0,
            online: paymentAgg.find((x: any) => x._id === "online")?.revenue || 0,
            memberCredit: paymentAgg.find((x: any) => x._id === "member_credit")?.revenue || 0,
            other: paymentAgg.find((x: any) => x._id === "other")?.revenue || 0,
        };

        // ── 8. Top Products ───────────────────────────────────────────────────
        const topProductsAgg = await Order.aggregate([
            { $match: periodMatchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    quantitySold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.subtotal" },
                    unitPrice: { $first: "$items.unitPrice" },
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 8 }
        ]);

        const totalTopRevenue = topProductsAgg.reduce((s: number, p: any) => s + p.revenue, 0);
        const topProducts = topProductsAgg.map((p: any) => ({
            ...p,
            revenueShare: totalTopRevenue > 0 ? Math.round((p.revenue / totalTopRevenue) * 100) : 0
        }));

        // ── 9. Category Breakdown ─────────────────────────────────────────────
        const categoryBreakdown = await Order.aggregate([
            { $match: periodMatchStage },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "productcategories",
                    localField: "product.category",
                    foreignField: "_id",
                    as: "cat"
                }
            },
            { $unwind: { path: "$cat", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ["$cat.name", "Uncategorized"] },
                    revenue: { $sum: "$items.subtotal" },
                    unitsSold: { $sum: "$items.quantity" },
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 8 }
        ]);

        // ── 10. Recent Orders ─────────────────────────────────────────────────
        const recentOrders = await Order.find({ gymId: gymIdStr })
            .populate("memberId", "firstName lastName email")
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

        // ── Build Response ────────────────────────────────────────────────────
        const responseData = {
            // Core stats
            totalProducts,
            totalRevenue,
            totalOrders,
            totalUnitsSold,
            avgOrderValue,
            cancelledOrders,
            pendingOrders,
            lowStockItems,
            outOfStockItems,
            // Period stats
            period,
            periodRevenue: currentRev,
            periodOrders: currentOrd,
            periodUnitsSold,
            periodAvgOrderValue,
            revenueTrend,
            ordersTrend,
            // Charts
            revenueChart,
            revenueBySource,
            revenueByPaymentMethod,
            categoryBreakdown,
            // Lists
            topProducts,
            inventoryAlerts,
            recentOrders,
            // Cache metadata
            cachedAt: new Date().toISOString(),
        };

        // Store in cache
        setCache(cacheKey, responseData);

        return NextResponse.json(responseData, {
            headers: { "X-Cache": "MISS" },
        });

    } catch (error: any) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
