import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import User from "@/models/User";
import "@/models/Member"; // Ensure Member model is registered for lookup
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import mongoose from "mongoose";
import { getCache, setCache } from "@/lib/redis";

// GET /api/trainers - List all trainers with member count
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.TRAINERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const gymId = (session.user as any).gymId;

    try {
        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;
        const cacheKey = `trainers:list:gym:${gymId}:user:${userId}:role:${userRole}`;

        const cached = await getCache<any[]>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();

        // Use aggregation to get trainers and count their members
        const matchCondition: any = {
            gymId: new mongoose.Types.ObjectId(gymId),
            role: "trainer",
            deletedAt: null,
        };

        // If user is a trainer, only show themselves
        if (userRole === 'trainer') {
            matchCondition._id = new mongoose.Types.ObjectId(userId);
        }

        const trainers = await User.aggregate([
            {
                $match: matchCondition,
            },
            {
                $lookup: {
                    from: "members",
                    localField: "_id",
                    foreignField: "trainerId",
                    pipeline: [
                        { $match: { deletedAt: null } }
                    ],
                    as: "assignedMembers"
                }
            },
            {
                $addFields: {
                    memberCount: { $size: "$assignedMembers" }
                }
            },
            {
                $project: {
                    password: 0,
                    assignedMembers: 0,
                    __v: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        await setCache(cacheKey, trainers, 1800); // 30 min cache
        return NextResponse.json(trainers);
    } catch (error) {
        console.error("Fetch trainers error:", error);
        return NextResponse.json({ message: "Failed to fetch trainers" }, { status: 500 });
    }
}
