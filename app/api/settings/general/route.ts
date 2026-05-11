import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import { authorize } from "@/lib/api-middleware";
import { GeneralSettingsSchema } from "@/lib/validations";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { getCache, setCache, deleteCache } from "@/lib/redis";

/**
 * GET /api/settings/general — Fetch general gym profile data
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

    const cacheKey = `gym:profile:${gymId}`;
    const cached = await getCache<any>(cacheKey);
    if (cached) return NextResponse.json({ general: cached });

    await connectDB();

    const gym = await Gym.findById(gymId).select("name address phone").lean();

    if (!gym) {
        return NextResponse.json({ message: "Gym not found" }, { status: 404 });
    }

    const general = {
        name: gym.name,
        address: gym.address,
        phone: gym.phone
    };

    await setCache(cacheKey, general, 3600);

    return NextResponse.json({ general });
}

/**
 * PUT /api/settings/general — Update general gym profile
 */
export async function PUT(req: Request) {
    const result = await authorize("settings:edit" as any);
    if ("error" in result) return result.error;

    const { session } = result;
    const body = await req.json();

    // Validate with Zod
    const parsed = GeneralSettingsSchema.safeParse(body);
    if (!parsed.success) {
        const flattened = parsed.error.flatten();
        return NextResponse.json(
            { 
                message: "Validation error", 
                errors: flattened.fieldErrors,
                formErrors: flattened.formErrors
            },
            { status: 400 }
        );
    }

    await connectDB();

    let gymId = session.user.gymId;
    const isSuperAdmin = session.user.role === "super_admin";
    if (isSuperAdmin && !gymId) {
        const firstGym = await Gym.findOne().sort({ createdAt: 1 });
        if (firstGym) gymId = firstGym._id.toString();
    }

    if (!gymId) {
        return NextResponse.json({ message: "No gym context found" }, { status: 404 });
    }

    // Get old values for audit
    const oldGym = await Gym.findById(gymId).lean();

    const updated = await Gym.findByIdAndUpdate(
        gymId,
        { 
            $set: {
                name: parsed.data.name,
                address: parsed.data.address,
                phone: parsed.data.phone
            } 
        },
        { new: true }
    ).lean();

    // Invalidate gym profile cache
    await deleteCache(`gym:profile:${gymId}`);

    // Audit log
    await logAudit({
        ...createCrudAuditEntry(
            session,
            "update",
            "gym",
            gymId,
            "General Profile Settings",
            { 
                before: { name: (oldGym as any)?.name, address: (oldGym as any)?.address, phone: (oldGym as any)?.phone }, 
                after: parsed.data 
            },
            req.headers
        ),
        action: "settings_update",
    });

    return NextResponse.json({ 
        general: {
            name: (updated as any).name,
            address: (updated as any).address,
            phone: (updated as any).phone
        } 
    });
}
