import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PlatformSettings from "@/models/PlatformSettings";
import { requireSuperAdmin } from "@/lib/api-middleware";

/**
 * GET /api/super-admin/settings — Fetch platform settings
 */
export async function GET() {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    await connectDB();

    let settings = await PlatformSettings.findOne().lean();
    if (!settings) {
        settings = await PlatformSettings.create({});
        settings = settings.toJSON();
    }

    return NextResponse.json({ settings });
}

/**
 * PUT /api/super-admin/settings — Update platform settings
 */
export async function PUT(req: Request) {
    const result = await requireSuperAdmin();
    if ("error" in result) return result.error;

    const body = await req.json();
    await connectDB();

    const settings = await PlatformSettings.findOneAndUpdate(
        {},
        { $set: body },
        { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ settings });
}
