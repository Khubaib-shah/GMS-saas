import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import TrainerBooking from "@/models/TrainerBooking";
import TrainerSlot from "@/models/TrainerSlot";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import mongoose from "mongoose";

export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.MEMBERS_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const trainerId = searchParams.get("trainerId");

        await connectDB();

        const tId = trainerId ? new mongoose.Types.ObjectId(trainerId) : null;
        const gymId = new mongoose.Types.ObjectId(session.user.gymId);

        // 1. Booking Stats (Completed vs No-Show)
        const bookingStats = await TrainerBooking.aggregate([
            {
                $match: {
                    gymId,
                    ...(tId ? { trainerId: tId } : {}),
                    status: { $in: ["completed", "no-show"] }
                }
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap: any = { completed: 0, "no-show": 0 };
        bookingStats.forEach(s => { statsMap[s._id] = s.count; });

        const totalSessions = statsMap.completed + statsMap["no-show"];
        const attendanceRate = totalSessions > 0 ? (statsMap.completed / totalSessions) * 100 : 0;

        // 2. Utilization Stats (Booked slots vs total capacity)
        const slotStats = await TrainerSlot.aggregate([
            {
                $match: {
                    gymId,
                    ...(tId ? { trainerId: tId } : {}),
                    deletedAt: null,
                    date: { $lte: new Date() } // Past and current slots only for utilization
                }
            },
            {
                $group: {
                    _id: null,
                    totalCapacity: { $sum: "$capacity" },
                    totalBooked: { $sum: "$bookedCount" }
                }
            }
        ]);

        const util = slotStats[0] || { totalCapacity: 0, totalBooked: 0 };
        const utilizationRate = util.totalCapacity > 0 ? (util.totalBooked / util.totalCapacity) * 100 : 0;

        return NextResponse.json({
            trainerId,
            sessionsCount: statsMap.completed,
            noShowCount: statsMap["no-show"],
            attendanceRate: Math.round(attendanceRate),
            utilizationRate: Math.round(utilizationRate),
            totalCapacity: util.totalCapacity,
            totalBooked: util.totalBooked
        });
    } catch (error) {
        console.error("Fetch metrics error:", error);
        return NextResponse.json({ message: "Error fetching metrics" }, { status: 500 });
    }
}
