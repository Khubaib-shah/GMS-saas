import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import { logAudit, extractRequestInfo } from "@/lib/audit";
import { invalidatePattern } from "@/lib/redis";

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

        // Fetch member details for audit log
        const member = await Member.findById(memberId).lean();
        const memberName = member ? `${member.firstName} ${member.lastName || ""}`.trim() : "Unknown Member";

        // Log audit
        await logAudit({
            gymId,
            userId: (session.user as any).id,
            userName: session.user.name || "Unknown User",
            action: "checkout",
            resource: "attendance",
            resourceId: attendance._id.toString(),
            resourceName: memberName,
            details: {
                checkOutTime: attendance.checkOutTime,
                durationMinutes: Math.floor((attendance.checkOutTime.getTime() - new Date(attendance.checkInTime).getTime()) / 60000)
            },
            branchId: attendance.branchId,
            ...extractRequestInfo(req.headers),
        });

        // Invalidate attendance report cache for this gym
        await invalidatePattern(`attendance:report:gym:${gymId}:*`);

        // Fetch subscription for feedback
        const subscription = await Subscription.findOne({
            memberId,
            gymId,
            deletedAt: null,
        }).sort({ endDate: -1 });

        return NextResponse.json({
            ...attendance.toJSON(),
            member: {
                id: memberId,
                fullName: memberName,
                attendanceStreak: member?.attendanceStreak || 0,
                activeSubscription: subscription ? {
                    planName: subscription.planId,
                    endDate: subscription.endDate,
                    status: subscription.status
                } : null
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error("Check-out error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
