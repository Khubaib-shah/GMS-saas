import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GymSettings from "@/models/GymSettings";
import { authorize } from "@/lib/api-middleware";
import { NotificationSettingsSchema, buildSetObject } from "@/lib/validations";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/settings/notifications — Fetch notification settings
 */
export async function GET() {
    const result = await authorize("settings:view" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    await connectDB();

    let settings = await GymSettings.findOne({ gymId: session.user.gymId }).lean();
    if (!settings) {
        settings = await GymSettings.create({ gymId: session.user.gymId });
        settings = settings.toJSON();
    }

    return NextResponse.json({ notifications: (settings as any).notifications });
}

/**
 * PUT /api/settings/notifications — Update notification settings
 */
export async function PUT(req: Request) {
    const result = await authorize("settings:edit" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    const body = await req.json();

    const parsed = NotificationSettingsSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    await connectDB();

    const oldSettings = await GymSettings.findOne({ gymId: session.user.gymId }).lean();

    const $set = buildSetObject("notifications", parsed.data);
    if (Object.keys($set).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await GymSettings.findOneAndUpdate(
        { gymId: session.user.gymId },
        { $set },
        { new: true, upsert: true }
    ).lean();

    await logAudit({
        ...createCrudAuditEntry(
            session,
            "update",
            "gym_settings",
            session.user.gymId,
            "Notification Settings",
            { before: (oldSettings as any)?.notifications, after: parsed.data },
            req.headers
        ),
        action: "settings_update",
    });

    return NextResponse.json({ notifications: (updated as any).notifications });
}
