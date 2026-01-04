import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import { isSubscriptionActive } from "@/lib/utils/file-utils";

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

        // 1. Check if member exists
        const member = await Member.findById(memberId);
        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // 2. Check for active subscription
        const subscriptions = await Subscription.find({ memberId: member.id, gymId });
        const activeSub = subscriptions.find(sub => isSubscriptionActive(sub.endDate, sub.status));

        if (!activeSub) {
            return NextResponse.json({ error: "No active subscription found for this member" }, { status: 403 });
        }

        // 3. Check if already checked in today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            memberId,
            gymId,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        if (existingAttendance) {
            return NextResponse.json({ error: "Member already checked in today" }, { status: 400 });
        }

        // 4. Create Attendance
        const newAttendance = await Attendance.create({
            gymId,
            memberId,
            date: startOfDay,
            checkInTime: new Date(),
            status: 'present'
        });

        return NextResponse.json(newAttendance, { status: 201 });

    } catch (error: any) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
