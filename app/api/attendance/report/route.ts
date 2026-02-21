import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import { getCache, setCache } from "@/lib/redis";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const gymId = searchParams.get("gymId");
        const date = searchParams.get("date"); // e.g., 2023-10-27
        const month = searchParams.get("month"); // e.g., 2023-10

        if (!gymId) {
            return NextResponse.json({ error: "Gym ID is required" }, { status: 400 });
        }

        const role = (session.user as any).role;
        const trainerId = role === 'trainer' ? (session.user as any).id : 'all';
        const cacheKey = `attendance:report:gym:${gymId}:date:${date || 'none'}:month:${month || 'none'}:trainer:${trainerId}`;

        // Cache-First
        const cachedReport = await getCache<any[]>(cacheKey);
        if (cachedReport) {
            console.log(`[Redis HIT] ${cacheKey}`);
            return NextResponse.json(cachedReport, { status: 200 });
        }

        console.log(`[Redis MISS] ${cacheKey} - Fetching from DB`);
        await connectDB();

        let query: any = { gymId };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        } else if (month) {
            // month format: YYYY-MM
            const [year, m] = month.split("-").map(Number);
            const startOfMonth = new Date(year, m - 1, 1);
            const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999);
            query.date = { $gte: startOfMonth, $lte: endOfMonth };
        }

        // Restrict to trainer's assigned members
        if ((session.user as any).role === 'trainer') {
            const Member = require("@/models/Member").default; // Dynamic import to ensure registration
            const trainerMembers = await Member.find({ trainerId: (session.user as any).id }).select('_id');
            const memberIds = trainerMembers.map((m: any) => m._id);
            query.memberId = { $in: memberIds };
        }

        const attendanceKeys = await Attendance.find(query).sort({ date: -1 }).populate("memberId", "firstName lastName photoBase64");

        // Store in Redis with a 5-minute TTL (Short TTL for operational data)
        await setCache(cacheKey, attendanceKeys, 300);

        return NextResponse.json(attendanceKeys, { status: 200 });

    } catch (error: any) {
        console.error("Attendance report error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
