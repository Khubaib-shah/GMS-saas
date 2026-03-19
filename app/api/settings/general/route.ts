import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GymSettings from "@/models/GymSettings";
import { authorize, buildGymQuery } from "@/lib/api-middleware";
import { GeneralSettingsSchema, buildSetObject } from "@/lib/validations";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/settings/general — Fetch general gym settings
 */
export async function GET() {
    const result = await authorize("settings:view" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    let gymId = session.user.gymId;
    const isSuperAdmin = session.user.role === "super_admin";

    await connectDB();

    if (isSuperAdmin && !gymId) {
        const Gym = require("@/models/Gym").default;
        const firstGym = await Gym.findOne().sort({ createdAt: 1 });
        if (firstGym) gymId = firstGym._id.toString();
    }

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    let settings = await GymSettings.findOne({ gymId }).lean();

    // Auto-create settings document if it doesn't exist
    if (!settings) {
        settings = await GymSettings.create({ gymId });
        settings = settings.toJSON();
    }

    return NextResponse.json({ general: (settings as any).general });
}

/**
 * PUT /api/settings/general — Update general gym settings
 * Uses Zod validation + partial $set to prevent object overwrite.
 */
export async function PUT(req: Request) {
    const result = await authorize("settings:edit" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    const body = await req.json();

    // Validate with Zod
    const parsed = GeneralSettingsSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    await connectDB();

    let gymId = session.user.gymId;
    const isSuperAdmin = session.user.role === "super_admin";
    if (isSuperAdmin && !gymId) {
        const Gym = require("@/models/Gym").default;
        const firstGym = await Gym.findOne().sort({ createdAt: 1 });
        if (firstGym) gymId = firstGym._id.toString();
    }

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    // Get old values for audit
    const oldSettings = await GymSettings.findOne({ gymId }).lean();

    const $set = buildSetObject("general", parsed.data);
    if (Object.keys($set).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await GymSettings.findOneAndUpdate(
        { gymId },
        { $set },
        { new: true, upsert: true }
    ).lean();

    // Audit log
    await logAudit({
        ...createCrudAuditEntry(
            session,
            "update",
            "gym_settings",
            gymId,
            "General Settings",
            { before: (oldSettings as any)?.general, after: parsed.data },
            req.headers
        ),
        action: "settings_update",
    });

    return NextResponse.json({ general: (updated as any).general });
}
