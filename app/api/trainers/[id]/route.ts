import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Member from "@/models/Member";
import { requirePermission } from "@/lib/api-middleware";
import { PERMISSIONS, hasPermission } from "@/lib/permissions";
import mongoose from "mongoose";
import { logAudit, extractRequestInfo } from "@/lib/audit";

// GET /api/trainers/[id] - Get Details + Member List
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.TRAINERS_VIEW);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;
    const { id } = await params;
    const gymId = (session.user as any).gymId;

    try {
        await connectDB();

        // Check if trainer exists - use lean() to get raw object (bypasses schema if fields missing in model)
        const trainer = await User.findOne({
            _id: id,
            gymId,
            role: "trainer",
            deletedAt: null
        }).select("-password").lean();

        if (!trainer) {
            return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
        }

        // Fetch assigned members
        const assignedMembers = await Member.find({
            trainerId: id,
            gymId,
            deletedAt: null
        }).select("firstName lastName email phone photoBase64 planId joinDate").lean();

        return NextResponse.json({
            ...trainer, // already POJO due to lean()
            members: assignedMembers
        });

    } catch (error) {
        console.error("Fetch trainer details error:", error);
        return NextResponse.json({ message: "Failed to fetch trainer details" }, { status: 500 });
    }
}

// PUT /api/trainers/[id] - Update Profile
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Custom auth check: Manager OR Self
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).gymId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const gymId = (session.user as any).gymId;

    // Check if user has management permission OR is the user themselves
    const canManage = hasPermission(userRole, PERMISSIONS.TRAINERS_MANAGE);
    const isSelf = userId === id;

    if (!canManage && !isSelf) {
        console.log(`Permission denied for user ${userId} trying to update ${id}`);
        return NextResponse.json({ message: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();

    try {
        await connectDB();

        // Construct update object
        const updateData: any = {};
        if (body.bio !== undefined) updateData.bio = body.bio;
        if (body.specialties !== undefined) updateData.specialties = body.specialties;
        if (body.photo !== undefined) updateData.photo = body.photo;
        if (body.certifications !== undefined) updateData.certifications = body.certifications;
        if (body.experienceYears !== undefined) updateData.experienceYears = body.experienceYears;
        if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
        if (body.maxMembersPerSlot !== undefined) updateData.maxMembersPerSlot = body.maxMembersPerSlot;
        if (body.trainerStatus !== undefined) updateData.trainerStatus = body.trainerStatus;

        console.log("Updating trainer", id);
        console.log("Body:", JSON.stringify(body, null, 2));
        console.log("Update Data:", JSON.stringify(updateData, null, 2));

        // Use strict: false to ensure fields are saved even if schema is stale
        const trainer = await User.findOneAndUpdate(
            { _id: id, gymId, role: "trainer", deletedAt: null },
            { $set: updateData },
            { new: true, strict: false }
        ).lean();

        if (!trainer) {
            console.log("Trainer not found for update (or role mismatch)");
            return NextResponse.json({ message: "Trainer not found" }, { status: 404 });
        }

        console.log("Trainer updated successfully. New data:", JSON.stringify(trainer, null, 2));

        // Audit Log
        const trainerName = (trainer as any).fullName || "Trainer"; // Handle lean type

        await logAudit({
            gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "update",
            resource: "trainer_profile",
            resourceId: id,
            resourceName: trainerName,
            details: body,
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json(trainer);

    } catch (error) {
        console.error("Update trainer profile error:", error);
        return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
    }
}
