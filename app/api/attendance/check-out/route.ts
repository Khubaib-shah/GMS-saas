import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { memberId, gymId } = await req.json();

        if (!memberId || !gymId) {
            return NextResponse.json(
                { error: "Member ID and Gym ID are required" },
                { status: 400 }
            );
        }

        await connectDB();

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            memberId,
            gymId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (!attendance) {
            return NextResponse.json({ error: "No check-in record found for today" }, { status: 404 });
        }

        if (attendance.checkOutTime) {
            return NextResponse.json({ error: "Member already checked out" }, { status: 400 });
        }

        attendance.checkOutTime = new Date();
        await attendance.save();

        return NextResponse.json(attendance, { status: 200 });

    } catch (error: any) {
        console.error("Check-out error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
