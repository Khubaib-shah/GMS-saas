import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-middleware";
import connectDB from "@/lib/db";
import mongoose from "mongoose";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import Plan from "@/models/Plan";
import { getCache, setCache } from "@/lib/redis";

// TTL: 2 minutes — stats are near-real-time, not long-lived
const STATS_CACHE_TTL = 120;

export async function GET(req: Request) {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    const url = new URL(req.url);
    const fromQuery = url.searchParams.get("from");
    const toQuery = url.searchParams.get("to");
    const isTrainer = session.user.role === 'trainer';
    const trainerId = isTrainer ? new mongoose.Types.ObjectId(session.user.id) : null;

    // ── Cache Check ────────────────────────────────────────────────────────────
    const cacheKey = `dashboard:stats:gym:${session.user.gymId}:role:${session.user.role}:from:${fromQuery || 'none'}:to:${toQuery || 'none'}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) {
        console.log(`[Redis HIT] ${cacheKey}`);
        return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
    }
    console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);

    let from: Date | undefined;
    let to: Date | undefined;

    if (fromQuery && toQuery) {
        from = new Date(fromQuery);
        to = new Date(toQuery);
        to.setHours(23, 59, 59, 999);
    }

    // Previous period logic
    let prevFrom: Date | undefined;
    let prevTo: Date | undefined;
    if (from && to) {
        const diff = to.getTime() - from.getTime();
        prevFrom = new Date(from.getTime() - diff);
        prevTo = new Date(from.getTime() - 1);
    }

    try {
        await connectDB();
        const gymId = new mongoose.Types.ObjectId(session.user.gymId);

        const calculateTrend = (current: number, prev: number) => {
            if (prev === 0 && current === 0) return 0;
            if (prev === 0) return 100;
            return ((current - prev) / prev) * 100;
        };

        // ── 1. Members ─────────────────────────────────────────────────────────
        const memberMatch: any = { gymId, deletedAt: null };
        if (isTrainer) memberMatch.trainerId = trainerId;

        const totalMembers = await Member.countDocuments(memberMatch);

        let currentNewMembers = totalMembers;
        let prevNewMembers = 0;
        if (from && to) {
            [currentNewMembers, prevNewMembers] = await Promise.all([
                Member.countDocuments({ ...memberMatch, joinDate: { $gte: from.toISOString(), $lte: to.toISOString() } }),
                Member.countDocuments({ ...memberMatch, joinDate: { $gte: prevFrom!.toISOString(), $lte: prevTo!.toISOString() } }),
            ]);
        }
        const membersTrend = from ? calculateTrend(currentNewMembers, prevNewMembers) : undefined;

        // ── 2. Check-ins ───────────────────────────────────────────────────────
        let memberIds: mongoose.Types.ObjectId[] = [];
        if (isTrainer) {
            const myMembers = await Member.find(memberMatch).select("_id").lean();
            memberIds = myMembers.map(m => m._id as mongoose.Types.ObjectId);
        }

        const attendanceMatch: any = { gymId };
        if (isTrainer) attendanceMatch.memberId = { $in: memberIds };

        let currentCheckins = await Attendance.countDocuments(attendanceMatch);
        let prevCheckins = 0;
        if (from && to) {
            [currentCheckins, prevCheckins] = await Promise.all([
                Attendance.countDocuments({ ...attendanceMatch, date: { $gte: from, $lte: to } }),
                Attendance.countDocuments({ ...attendanceMatch, date: { $gte: prevFrom!, $lte: prevTo! } }),
            ]);
        }
        const checkinsTrend = from ? calculateTrend(currentCheckins, prevCheckins) : undefined;

        // ── 3. Revenue (non-trainers only) ─────────────────────────────────────
        let currentRevenue = 0;
        let revenueTrend: number | undefined = undefined;
        let revenueChartData: any[] = [];

        if (!isTrainer) {
            const paymentMatch: any = { gymId, deletedAt: null };

            if (from && to) {
                const [currentAgg, prevAgg, dailyRevAgg] = await Promise.all([
                    Payment.aggregate([
                        { $match: { ...paymentMatch, date: { $gte: from.toISOString(), $lte: to.toISOString() } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]),
                    Payment.aggregate([
                        { $match: { ...paymentMatch, date: { $gte: prevFrom!.toISOString(), $lte: prevTo!.toISOString() } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]),
                    Payment.aggregate([
                        { $match: { ...paymentMatch, date: { $gte: from.toISOString(), $lte: to.toISOString() } } },
                        { $group: { _id: { $substr: ["$date", 0, 10] }, value: { $sum: "$amount" } } },
                        { $sort: { "_id": 1 } }
                    ]),
                ]);
                currentRevenue = currentAgg[0]?.total || 0;
                revenueTrend = calculateTrend(currentRevenue, prevAgg[0]?.total || 0);
                revenueChartData = dailyRevAgg;
            } else {
                const currentYear = new Date().getFullYear().toString();
                const [allAgg, monthlyRevAgg] = await Promise.all([
                    Payment.aggregate([{ $match: paymentMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
                    Payment.aggregate([
                        { $match: { ...paymentMatch, date: { $gte: `${currentYear}-01-01`, $lte: `${currentYear}-12-31` } } },
                        { $group: { _id: { $substr: ["$date", 5, 2] }, value: { $sum: "$amount" } } },
                        { $sort: { "_id": 1 } }
                    ]),
                ]);
                currentRevenue = allAgg[0]?.total || 0;
                revenueChartData = monthlyRevAgg;
            }
        }

        // ── 4. Expiring Soon ───────────────────────────────────────────────────
        const todayStr = new Date().toISOString();
        const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const expiringAgg = await Subscription.aggregate([
            { $match: { gymId, status: "active" } },
            { $sort: { endDate: -1 } },
            { $group: { _id: "$memberId", endDate: { $first: "$endDate" } } },
            { $match: { endDate: { $gte: todayStr, $lte: nextWeekStr } } }
        ]);

        let expiringSoon = 0;
        if (isTrainer) {
            const myMemberStrings = memberIds.map(id => id.toString());
            expiringSoon = expiringAgg.filter(s => myMemberStrings.includes(s._id)).length;
        } else {
            expiringSoon = expiringAgg.length;
        }

        // ── 5. Chart Data (non-trainers only) ─────────────────────────────────
        let subscriptionChartData: any[] = [];
        let membershipStatusData: any[] = [];
        let attendanceChartData: any[] = [];

        if (!isTrainer) {
            const attQuery: any = { gymId };
            attQuery.date = from && to
                ? { $gte: from, $lte: to }
                : { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };

            const [subsByPlan, plans, memberStatuses, attAgg] = await Promise.all([
                Subscription.aggregate([
                    { $match: { gymId } },
                    { $sort: { endDate: -1 } },
                    { $group: { _id: "$memberId", planId: { $first: "$planId" } } },
                    { $group: { _id: "$planId", count: { $sum: 1 } } }
                ]),
                Plan.find({ gymId }).lean(),
                Subscription.aggregate([
                    { $match: { gymId } },
                    { $sort: { endDate: -1 } },
                    { $group: { _id: "$memberId", endDate: { $first: "$endDate" }, status: { $first: "$status" } } }
                ]),
                Attendance.aggregate([
                    { $match: attQuery },
                    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, count: { $sum: 1 } } },
                    { $sort: { _id: 1 } }
                ]),
            ]);

            const planMap = new Map(plans.map(p => [p.id, p.name]));
            subscriptionChartData = subsByPlan.map(s => ({
                name: planMap.get(s._id) || "Unknown Plan",
                value: s.count
            }));

            let active = 0, expiring = 0, expired = 0;
            memberStatuses.forEach(s => {
                const daysLeft = (new Date(s.endDate).getTime() - Date.now()) / 86400000;
                if (s.status === "active" && daysLeft > 7) active++;
                else if (s.status === "active" && daysLeft > 0 && daysLeft <= 7) expiring++;
                else expired++;
            });
            membershipStatusData = [
                { name: "Active", value: active, color: "bg-emerald-500" },
                { name: "Expiring Soon", value: expiring, color: "bg-amber-500" },
                { name: "Expired", value: expired, color: "bg-rose-500" }
            ];

            attendanceChartData = attAgg;
        }

        // ── 6. Top 10 Members for Dashboard Tables ──────────────────────────
        let recentMembersList: any[] = [];
        let expiringMembersList: any[] = [];

        const recentRaw = await Member.find(memberMatch)
            .sort({ joinDate: -1 })
            .limit(10)
            .select("firstName lastName joinDate")
            .lean();
            
        const recentIds = recentRaw.map(m => m._id);
        const recentSubs = await Subscription.find({ memberId: { $in: recentIds }, status: "active" }).lean();
        
        recentMembersList = recentRaw.map(m => {
            const sub = recentSubs.find(s => s.memberId.toString() === m._id.toString());
            return {
                member: { id: m._id.toString(), firstName: m.firstName, lastName: m.lastName, joinDate: m.joinDate },
                subscription: sub ? { endDate: sub.endDate } : null,
                status: sub ? (new Date(sub.endDate) > new Date() ? "active" : "expired") : "expired"
            };
        });

        // Expiring
        const expiringIdsToFetch = isTrainer ? memberIds.map(id => id.toString()).filter(id => expiringAgg.some(s => s._id.toString() === id)) : expiringAgg.map(s => s._id);
        
        const expiringRaw = await Member.find({ _id: { $in: expiringIdsToFetch } })
            .limit(10)
            .select("firstName lastName joinDate")
            .lean();
            
        expiringMembersList = expiringRaw.map(m => {
            const sub = expiringAgg.find(s => s._id.toString() === m._id.toString());
            const daysLeft = sub ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
            return {
                member: { id: m._id.toString(), firstName: m.firstName, lastName: m.lastName, joinDate: m.joinDate },
                subscription: sub ? { endDate: sub.endDate } : null,
                status: daysLeft > 0 && daysLeft <= 7 ? "expiring" : (daysLeft > 7 ? "active" : "expired"),
                daysLeft
            };
        });

        // ── Build + Cache Response ─────────────────────────────────────────────
        const responseData = {
            stats: {
                totalMembers,
                currentNewMembers,
                membersTrend,
                currentCheckins,
                checkinsTrend,
                currentRevenue,
                revenueTrend,
                expiringSoon
            },
            charts: {
                revenueChartData,
                attendanceChartData,
                subscriptionChartData,
                membershipStatusData
            },
            tables: {
                recentMembers: recentMembersList,
                expiringMembers: expiringMembersList
            }
        };

        await setCache(cacheKey, responseData, STATS_CACHE_TTL);

        return NextResponse.json(responseData, { headers: { "X-Cache": "MISS" } });

    } catch (error: any) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
