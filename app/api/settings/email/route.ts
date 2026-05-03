import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import GymSettings from "@/models/GymSettings";
import Gym from "@/models/Gym";
import { authorize } from "@/lib/api-middleware";
import { EmailSettingsSchema, buildSetObject } from "@/lib/validations";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { deleteCache } from "@/lib/redis";
import mongoose from "mongoose";

/**
 * GET /api/settings/email — Fetch email configuration
 */
export async function GET() {
    const result = await authorize("settings:view" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    let gymId = session.user.gymId;
    const isSuperAdmin = session.user.role === "super_admin";

    await connectDB();

    if (isSuperAdmin && !gymId) {
        const firstGym = await Gym.findOne().sort({ createdAt: 1 });
        if (firstGym) gymId = firstGym._id.toString();
    }

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    // Use explicit ObjectId for matching
    const query = { gymId: new mongoose.Types.ObjectId(gymId) };
    let settings = await GymSettings.findOne(query).lean();

    const defaultEmail = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "",
        fromEmail: "",
    };

    if (!settings) {
        settings = await GymSettings.create({ 
            gymId: new mongoose.Types.ObjectId(gymId),
            email: defaultEmail
        });
        settings = settings.toJSON();
    }

    return NextResponse.json({ 
        email: {
            ...defaultEmail,
            ...(settings as any).email
        } 
    });
}

/**
 * PUT /api/settings/email — Update email configuration
 */
export async function PUT(req: Request) {
    const result = await authorize("settings:edit" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    let gymId = session.user.gymId;
    const isSuperAdmin = session.user.role === "super_admin";

    await connectDB();

    if (isSuperAdmin && !gymId) {
        const firstGym = await Gym.findOne().sort({ createdAt: 1 });
        if (firstGym) gymId = firstGym._id.toString();
    }

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    const body = await req.json();

    const parsed = EmailSettingsSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    const query = { gymId: new mongoose.Types.ObjectId(gymId) };
    const oldSettings = await GymSettings.findOne(query).lean();

    const $set = buildSetObject("email", parsed.data);
    
    console.log(`[EmailSettings] Updating Gym ${gymId} with:`, $set);

    const updated = await GymSettings.findOneAndUpdate(
        query,
        { $set },
        { new: true, upsert: true }
    ).lean();

    // Invalidate caches
    await deleteCache(`gym:settings:${gymId}`);
    // Also clear the frontend cache by notifying it (handled by frontend reload or state update)

    await logAudit({
        ...createCrudAuditEntry(
            session,
            "update",
            "gym_settings",
            gymId,
            "Email Configuration",
            { before: (oldSettings as any)?.email, after: parsed.data },
            req.headers
        ),
        action: "settings_update",
    });

    const defaultEmail = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "",
        fromEmail: "",
    };

    return NextResponse.json({ 
        email: {
            ...defaultEmail,
            ...(updated as any).email
        } 
    });
}
