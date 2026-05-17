import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, invalidatePattern } from "@/lib/redis";
import { CreateStaffSchema } from "@/lib/validations";

// GET /api/staff - List all staff for the gym
export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.STAFF_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    let gymId = session.user.gymId;

    try {
        const cacheKey = `staff:list:gym:${gymId}`;
        const cached = await getCache<any[]>(cacheKey);
        if (cached) return NextResponse.json(cached);

        await connectDB();

        if (session.user.role === "super_admin" && !gymId) {
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
            .sort({ createdAt: -1 })
            .lean();

        await setCache(cacheKey, staff, 3600);
        return NextResponse.json(staff);
    } catch (error: any) {
        console.error("Fetch staff error:", error);
        return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
    }
}

// POST /api/staff - Create a new staff member
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    let gymId = session.user.gymId;

    try {
        const body = await req.json();

        // ── Zod Validation (includes PasswordSchema complexity check) ──
        const parsed = CreateStaffSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { fullName, email, password, role: newRole } = parsed.data;
        await connectDB();

        if (session.user.role === "super_admin" && !gymId) {
            const Gym = require("@/models/Gym").default;
            const firstGym = await Gym.findOne().sort({ createdAt: 1 });
            if (firstGym) gymId = firstGym._id.toString();
        }

        if (!gymId) {
            return NextResponse.json({ error: "No gym context found" }, { status: 404 });
        }

        if (session.user.role === 'manager' && newRole === 'manager') {
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

        // Invalidate Cache
        await invalidatePattern(`staff:list:gym:${gymId}*`);

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "user",
                newUser._id.toString(),
                newUser.fullName,
                { role: newRole, email },
                req.headers
            )
        );

        const { password: _, ...userWithoutPass } = newUser.toJSON();
        return NextResponse.json(userWithoutPass, { status: 201 });

    } catch (error: any) {
        console.error("Create staff error:", error);
        return NextResponse.json({ error: error.message || "Failed to create staff" }, { status: 500 });
    }
}

// DELETE /api/staff?id=... - Soft delete staff
export async function DELETE(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    let gymId = session.user.gymId;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }
        await connectDB();

        if (session.user.role === "super_admin" && !gymId) {
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

        // Invalidate Cache
        await invalidatePattern(`staff:list:gym:${gymId}*`);
        await invalidatePattern(`trainers:list:gym:${gymId}*`); // Staff could be trainers

        // Audit
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "user",
                user._id.toString(),
                user.fullName,
                undefined,
                req.headers
            )
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete staff error:", error);
        return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
    }
}
