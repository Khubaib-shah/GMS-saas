import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GymSettings from "@/models/GymSettings";
import { authorize } from "@/lib/api-middleware";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/settings/modules — Fetch module feature toggles
 */
export async function GET() {
    const result = await authorize("settings:view" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    const gymId = session.user.gymId;

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    try {
        await connectDB();
        let settings = await GymSettings.findOne({ gymId }).lean();
        if (!settings) {
            settings = await GymSettings.create({ gymId });
        }

        return NextResponse.json({ modules: (settings as any).modules });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PUT /api/settings/modules — Update module feature toggles
 */
export async function PUT(req: Request) {
    const result = await authorize("settings:edit" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    const gymId = session.user.gymId;

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    try {
        const body = await req.json();
        // Simple validation: expect an object with boolean values
        const modules = body.modules;
        if (!modules || typeof modules !== "object") {
            return NextResponse.json({ error: "Invalid modules payload" }, { status: 400 });
        }

        await connectDB();
        const oldSettings = await GymSettings.findOne({ gymId }).lean();

        const updated = await GymSettings.findOneAndUpdate(
            { gymId },
            { 
                $set: { 
                    "modules.trainersEnabled": !!modules.trainersEnabled,
                    "modules.attendanceEnabled": !!modules.attendanceEnabled,
                    "modules.sellingEnabled": !!modules.sellingEnabled,
                } 
            },
            { new: true, upsert: true }
        ).lean();

        // Audit log
        await logAudit({
            ...createCrudAuditEntry(
                session,
                "update",
                "gym_settings",
                gymId,
                "Module Feature Toggles",
                { before: (oldSettings as any)?.modules, after: modules },
                req.headers
            ),
            action: "settings_update",
        });

        return NextResponse.json({ modules: (updated as any).modules });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
