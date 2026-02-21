import { NextResponse } from "next/server";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo } from "@/lib/audit";
import connectDB from "@/lib/db";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import Subscription from "@/models/Subscription";
import Gym from "@/models/Gym";
import { isSubscriptionActive } from "@/lib/utils/file-utils";
import { invalidatePattern } from "@/lib/redis";

export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.ATTENDANCE_CHECKIN);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { memberId, branchId } = await req.json();

        if (!memberId) {
            return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
        }

        const gymId = session.user.gymId;

        await connectDB();

        // Get gym settings for attendance rules
        const gym = await Gym.findById(gymId).lean();
        const attendanceRules = (gym as any)?.settings?.attendanceRules || {
            preventDuplicateCheckin: true,
            dailyLimit: 1,
        };

        // 1. Check if member exists
        const member = await Member.findOne({
            _id: memberId,
            gymId,
            deletedAt: null,
        });

        if (!member) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        // 2. Check for active subscription (not paused or expired)
        const subscription = await Subscription.findOne({
            memberId: member.id,
            gymId,
            deletedAt: null,
        }).sort({ endDate: -1 });

        if (!subscription) {
            return NextResponse.json({ error: "No subscription found for this member" }, { status: 403 });
        }

        // Block check-in for paused subscriptions
        if (subscription.status === "paused") {
            return NextResponse.json({
                error: "Subscription is paused. Member cannot check in.",
                isPaused: true,
            }, { status: 403 });
        }

        // Check if subscription is expired
        if (!isSubscriptionActive(subscription.endDate, subscription.status)) {
            return NextResponse.json({
                error: "Subscription has expired",
                isExpired: true,
            }, { status: 403 });
        }

        // 3. Check for duplicate check-in today (if rule enabled)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        if (attendanceRules.preventDuplicateCheckin) {
            const todayCheckIns = await Attendance.countDocuments({
                memberId,
                gymId,
                date: { $gte: startOfDay, $lte: endOfDay },
            });

            if (todayCheckIns >= attendanceRules.dailyLimit) {
                return NextResponse.json({
                    error: `Daily check-in limit (${attendanceRules.dailyLimit}) reached`,
                    dailyLimitReached: true,
                }, { status: 400 });
            }
        }

        // 4. Calculate attendance streak
        let newStreak = 1;
        const lastCheckIn = member.lastCheckIn;

        if (lastCheckIn) {
            const lastCheckInDate = new Date(lastCheckIn);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const lastCheckInDay = new Date(lastCheckInDate);
            lastCheckInDay.setHours(0, 0, 0, 0);

            // If last check-in was yesterday, increment streak
            if (lastCheckInDay.getTime() === yesterday.getTime()) {
                newStreak = (member.attendanceStreak || 0) + 1;
            }
            // If last check-in was today, keep current streak
            else if (lastCheckInDay.getTime() === startOfDay.getTime()) {
                newStreak = member.attendanceStreak || 1;
            }
            // Otherwise, reset streak to 1
        }

        // 5. Create Attendance record
        const newAttendance = await Attendance.create({
            gymId,
            memberId,
            date: startOfDay,
            checkInTime: new Date(),
            status: "present",
            branchId: branchId || session.user.branchId,
        });

        // 6. Update member stats
        await Member.updateOne(
            { _id: memberId },
            {
                $set: {
                    lastCheckIn: new Date(),
                    attendanceStreak: newStreak,
                },
                $inc: { totalCheckIns: 1 },
            }
        );

        // 7. Audit log
        await logAudit({
            gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "checkin",
            resource: "attendance",
            resourceId: newAttendance._id.toString(),
            resourceName: `${member.firstName} ${member.lastName || ""}`.trim(),
            details: { streak: newStreak },
            branchId: branchId || session.user.branchId,
            ...extractRequestInfo(req.headers),
        });

        // Invalidate attendance report cache for this gym
        await invalidatePattern(`attendance:report:gym:${gymId}:*`);

        return NextResponse.json({
            ...newAttendance.toJSON(),
            memberName: `${member.firstName} ${member.lastName || ""}`.trim(),
            streak: newStreak,
        }, { status: 201 });

    } catch (error: any) {
        console.error("Check-in error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

