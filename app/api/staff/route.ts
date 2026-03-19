import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logAudit, extractRequestInfo } from "@/lib/audit";

// GET /api/staff - List all staff for the gym
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let gymId = (session.user as any).gymId;
        const isSuperAdmin = (session.user as any).role === "super_admin";

        if (!gymId && !isSuperAdmin) {
            return NextResponse.json({ error: "No gym associated" }, { status: 400 });
        }

        await connectDB();

        if (isSuperAdmin && !gymId) {
            const Gym = require("@/models/Gym").default;
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ error: "No gym context found" }, { status: 404 });
        }


        // Fetch users in this gym who are staff (manager, receptionist, trainer)
        // Exclude the current user (owner/self) from the list if desired, or show all
        const staff = await User.find({
            gymId,
            deletedAt: null,
            _id: { $ne: (session.user as any).id }, // Exclude self
            role: { $in: ["manager", "receptionist", "trainer", "accountant", "staff"] }
        })
            .select("-password")
            .sort({ createdAt: -1 });

        return NextResponse.json(staff);
    } catch (error: any) {
        console.error("Fetch staff error:", error);
        return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
    }
}

// POST /api/staff - Create a new staff member
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Logic check: Only owner or manager (with perm) can add staff?
        // Rely on caller checks or add here.
        // Assuming Owner/Manager role is sufficient for now.
        const role = (session.user as any).role;
        const allowedRoles = ["super_admin", "gym_owner", "owner", "manager"];
        if (!allowedRoles.includes(role)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { fullName, email, password, role: newRole } = body;
        let gymId = (session.user as any).gymId;
        const isSuperAdmin = role === "super_admin";

        await connectDB();

        if (isSuperAdmin && !gymId) {
            const Gym = require("@/models/Gym").default;
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ error: "No gym context found" }, { status: 404 });
        }

        if (!fullName || !email || !password || !newRole) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Validate role to assign
        const allowedNewRoles = ["manager", "receptionist", "trainer", "accountant"];
        if (!allowedNewRoles.includes(newRole)) {
            return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
        }

        if (role === 'manager' && newRole === 'manager') {
            return NextResponse.json({ error: "Managers cannot create other Managers" }, { status: 403 });
        }

        // Check duplicates
        const existing = await User.findOne({ email });
        if (existing) {
            return NextResponse.json({ error: "Email already taken" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role: newRole,
            gymId,
            isActive: true
        });

        // Audit Log
        await logAudit({
            gymId,
            userId: (session.user as any).id,
            userName: session?.user?.name || "User",
            action: "create",
            resource: "user",
            resourceId: newUser._id.toString(),
            resourceName: newUser.fullName,
            details: { role: newRole, email },
            ...extractRequestInfo(req.headers),
        });

        const { password: _, ...userWithoutPass } = newUser.toJSON();
        return NextResponse.json(userWithoutPass, { status: 201 });

    } catch (error: any) {
        console.error("Create staff error:", error);
        return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 500 });
    }
}

// DELETE /api/staff?id=... - Soft delete staff
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let gymId = (session.user as any).gymId;
        const isSuperAdmin = (session.user as any).role === "super_admin";

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        await connectDB();

        if (isSuperAdmin && !gymId) {
            const Gym = require("@/models/Gym").default;
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ error: "No gym context found" }, { status: 404 });
        }

        const user = await User.findOne({ _id: id, gymId });
        if (!user) {
            return NextResponse.json({ error: "Staff not found" }, { status: 404 });
        }

        // Prevent deleting self? (Already handled by GET exclusion but safer here)
        if (user._id.toString() === (session.user as any).id) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
        }

        user.deletedAt = new Date();
        user.isActive = false;
        await user.save();

        // Audit
        await logAudit({
            gymId,
            userId: (session.user as any).id,
            userName: session?.user?.name || "User",
            action: "delete",
            resource: "user",
            resourceId: user._id.toString(),
            resourceName: user.fullName,
            ...extractRequestInfo(req.headers),
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete staff error:", error);
        return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
    }
}
