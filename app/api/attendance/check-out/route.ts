import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { invalidatePattern } from "@/lib/redis";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import SubscriptionPlan from "@/models/SubscriptionPlan";

export async function POST(req: Request) {
    try {
        const authResult = await requirePermission(PERMISSIONS.ATTENDANCE_CHECKOUT);
        if ("error" in authResult) return authResult.error;
        const { session } = authResult;

        const { memberId, gymId, method = "manual", date: providedDate } = await req.json();

        if (!memberId || !gymId) {
            return NextResponse.json(
                { error: "Member ID and Gym ID are required" },
                { status: 400 }
            );
        }

        await connectDB();

        // 0. Feature Gate Check (Manual vs QR)
        const subPlan = await SubscriptionPlan.findOne({ gymId, active: true }).lean();
        if (!subPlan) {
            return NextResponse.json({ error: "No active subscription plan" }, { status: 403 });
        }

        const requiredFeature = method === "qr" ? "qrAttendance" : "manualAttendance";
        const hasSpecificFeature = subPlan.enabledFeatures?.includes(requiredFeature);
        const hasLegacyFeature = subPlan.enabledFeatures?.includes("attendance");

        if (!hasSpecificFeature && !hasLegacyFeature) {
            return NextResponse.json({
                error: `Feature not available on your plan: ${method === "qr" ? "QR Attendance" : "Manual Attendance"}`,
                feature: requiredFeature
            }, { status: 403 });
        }

        const startOfDay = providedDate ? new Date(providedDate) : new Date();
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
        await logAudit(
            createCrudAuditEntry(
                session,
                "update",
                "attendance",
                attendance._id.toString(),
                memberName,
                {
                    checkOutTime: attendance.checkOutTime,
                    durationMinutes: Math.floor((attendance.checkOutTime.getTime() - new Date(attendance.checkInTime).getTime()) / 60000)
                },
                req.headers
            )
        );

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
