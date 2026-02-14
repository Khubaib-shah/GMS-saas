import { NextResponse } from "next/server";
import { requireAuth, requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, extractRequestInfo, createCrudAuditEntry } from "@/lib/audit";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";

/**
 * GET /api/gym/branches - Get all branches for the current gym
 */
export async function GET() {
    const authResult = await requireAuth();
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        await connectDB();
        const gym = await Gym.findById(session.user.gymId).lean();

        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        return NextResponse.json({
            branches: gym.branches || [],
            settings: gym.settings || {},
        });
    } catch (error) {
        console.error("Get branches error:", error);
        return NextResponse.json({ message: "Error fetching branches" }, { status: 500 });
    }
}

/**
 * POST /api/gym/branches - Create a new branch
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { name, address, phone, email, isDefault } = body;

        if (!name) {
            return NextResponse.json({ message: "Branch name is required" }, { status: 400 });
        }

        await connectDB();

        const gym = await Gym.findById(session.user.gymId);
        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        // If this is the first branch or marked as default, update other branches
        if (isDefault && gym.branches.length > 0) {
            gym.branches.forEach((branch: any) => {
                branch.isDefault = false;
            });
        }

        const newBranch = {
            name,
            address,
            phone,
            email,
            isActive: true,
            isDefault: isDefault || gym.branches.length === 0, // First branch is default
        };

        gym.branches.push(newBranch);
        gym.settings.allowMultipleBranches = true;
        await gym.save();

        const createdBranch = gym.branches[gym.branches.length - 1];

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "create",
            resource: "branch",
            resourceId: createdBranch._id.toString(),
            resourceName: name,
            details: { branch: newBranch },
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({ branch: createdBranch }, { status: 201 });
    } catch (error) {
        console.error("Create branch error:", error);
        return NextResponse.json({ message: "Error creating branch" }, { status: 500 });
    }
}

/**
 * PUT /api/gym/branches - Update a branch
 */
export async function PUT(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const body = await req.json();
        const { branchId, name, address, phone, email, isActive, isDefault } = body;

        if (!branchId) {
            return NextResponse.json({ message: "Branch ID is required" }, { status: 400 });
        }

        await connectDB();

        const gym = await Gym.findById(session.user.gymId);
        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        const branchIndex = gym.branches.findIndex((b: any) => b._id.toString() === branchId);
        if (branchIndex === -1) {
            return NextResponse.json({ message: "Branch not found" }, { status: 404 });
        }

        const oldBranch = { ...gym.branches[branchIndex].toObject() };

        // Update branch
        if (name !== undefined) gym.branches[branchIndex].name = name;
        if (address !== undefined) gym.branches[branchIndex].address = address;
        if (phone !== undefined) gym.branches[branchIndex].phone = phone;
        if (email !== undefined) gym.branches[branchIndex].email = email;
        if (isActive !== undefined) gym.branches[branchIndex].isActive = isActive;

        // Handle default branch change
        if (isDefault) {
            gym.branches.forEach((branch: any, idx: number) => {
                branch.isDefault = idx === branchIndex;
            });
        }

        await gym.save();

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "update",
            resource: "branch",
            resourceId: branchId,
            resourceName: name || oldBranch.name,
            details: { before: oldBranch, after: gym.branches[branchIndex] },
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({ branch: gym.branches[branchIndex] });
    } catch (error) {
        console.error("Update branch error:", error);
        return NextResponse.json({ message: "Error updating branch" }, { status: 500 });
    }
}

/**
 * DELETE /api/gym/branches - Delete a branch (soft delete by marking inactive)
 */
export async function DELETE(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
    if ("error" in authResult) return authResult.error;

    const { session } = authResult;

    try {
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get("branchId");

        if (!branchId) {
            return NextResponse.json({ message: "Branch ID is required" }, { status: 400 });
        }

        await connectDB();

        const gym = await Gym.findById(session.user.gymId);
        if (!gym) {
            return NextResponse.json({ message: "Gym not found" }, { status: 404 });
        }

        const branch = gym.branches.find((b: any) => b._id.toString() === branchId);
        if (!branch) {
            return NextResponse.json({ message: "Branch not found" }, { status: 404 });
        }

        // Soft delete - mark as inactive
        branch.isActive = false;
        await gym.save();

        // Audit log
        await logAudit({
            gymId: session.user.gymId,
            userId: session.user.id,
            userName: session.user.name,
            action: "delete",
            resource: "branch",
            resourceId: branchId,
            resourceName: branch.name,
            details: { softDelete: true },
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({ message: "Branch deactivated" });
    } catch (error) {
        console.error("Delete branch error:", error);
        return NextResponse.json({ message: "Error deleting branch" }, { status: 500 });
    }
}
