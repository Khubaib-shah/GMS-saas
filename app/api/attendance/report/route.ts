import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";

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

        const attendanceKeys = await Attendance.find(query).sort({ date: -1 }).populate("memberId", "firstName lastName photoBase64");

        return NextResponse.json(attendanceKeys, { status: 200 });

    } catch (error: any) {
        console.error("Attendance report error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
