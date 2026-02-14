import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import User from "@/models/User";
import "@/models/Member"; // Ensure Member model is registered for lookup
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import mongoose from "mongoose";

// GET /api/trainers - List all trainers with member count
export async function GET(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.TRAINERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        // Use aggregation to get trainers and count their members
        const matchCondition: any = {
            gymId: new mongoose.Types.ObjectId(gymId),
            role: "trainer",
            deletedAt: null,
        };

        // If user is a trainer, only show themselves
        if ((session.user as any).role === 'trainer') {
            matchCondition._id = new mongoose.Types.ObjectId((session.user as any).id);
        }

        const trainers = await User.aggregate([
            {
                $match: matchCondition,
            },
            {
                $lookup: {
                    from: "members", // Collection name (usually lowercase plural)
                    let: { trainerId: { $toString: "$_id" } }, // Convert Object ID to string to match member store? 
                    // Wait, member.trainerId is likely a string based on Member.ts definition "type: mongoose.Schema.Types.ObjectId" but in schema it might be stored as ObjectId
                    // Let's check Member.ts again. It says "type: mongoose.Schema.Types.ObjectId, ref: 'User'".
                    // So we should match ObjectId to ObjectId.
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$trainerId", "$$trainerId"] }, // This assumes localField is passed as variable? No, let's use standard lookup if types match
                                        { $eq: ["$deletedAt", null] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "assignedMembers"
                }
            },
            // Cleaner lookup attempt if types match:
            // from: "members", localField: "_id", foreignField: "trainerId", as: "assignedMembers"
            // But we need to filter members by deletedAt: null.
            // So pipeline is better.

            // Actually, let's verity if Member.trainerId is ObjectId. Yes.
            // But User._id is ObjectId.
            // So simplistic lookup:
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
                    assignedMembers: 0, // Don't send the full list list in the summary view
                    __v: 0
                }
            },
            { $sort: { createdAt: -1 } }
        ]);

        return NextResponse.json(trainers);
    } catch (error) {
        console.error("Fetch trainers error:", error);
        return NextResponse.json({ message: "Failed to fetch trainers" }, { status: 500 });
    }
}
