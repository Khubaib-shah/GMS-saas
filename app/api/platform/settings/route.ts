import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformSettings from "@/models/PlatformSettings";
import { requireSuperAdmin } from "@/lib/api-middleware";
import { PlatformSettingsUpdateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

/**
 * GET /api/platform/settings — Fetch global platform settings (super admin only)
 */
export async function GET() {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    await connectDB();

    // Singleton pattern — find or create
    let settings = await PlatformSettings.findOne().lean();
    if (!settings) {
        settings = await PlatformSettings.create({});
        settings = settings.toJSON();
    }

    return NextResponse.json({ settings });
}

/**
 * PUT /api/platform/settings — Update platform settings (super admin only)
 */
export async function PUT(req: Request) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const { session } = result;
    const body = await req.json();

    const parsed = PlatformSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    await connectDB();

    const oldSettings = await PlatformSettings.findOne().lean();

    // Build $set carefully to avoid overwriting
    const $set: Record<string, any> = {};
    const data = parsed.data;

    if (data.maintenanceMode !== undefined) $set.maintenanceMode = data.maintenanceMode;
    if (data.defaultTrialDays !== undefined) $set.defaultTrialDays = data.defaultTrialDays;
    if (data.featureFlags) {
        for (const [key, value] of Object.entries(data.featureFlags)) {
            if (value !== undefined) {
                $set[`featureFlags.${key}`] = value;
            }
        }
    }
    if (data.pricingTiers) $set.pricingTiers = data.pricingTiers;

    if (Object.keys($set).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    const updated = await PlatformSettings.findOneAndUpdate(
        {},
        { $set },
        { new: true, upsert: true }
    ).lean();

    // Audit
    await logAudit({
        gymId: "platform",
        userId: session.user.id,
        userName: session.user.name,
        action: "settings_update",
        resource: "platform_settings",
        resourceId: "singleton",
        details: { before: oldSettings, after: data },
    });

    return NextResponse.json({ settings: updated });
}
