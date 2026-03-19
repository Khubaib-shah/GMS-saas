import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { CreateRoleSchema } from "@/lib/validations";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";
import { ALL_PERMISSIONS } from "@/lib/permissions";

/**
 * GET /api/roles — List all roles for the current gym
 */
export async function GET() {
    const authResult = await requirePermission(PERMISSIONS.ROLES_VIEW);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    await connectDB();

    const roles = await Role.find(buildGymQuery(session)).sort({ isSystemRole: -1, name: 1 }).lean();

    return NextResponse.json({ roles, allPermissions: ALL_PERMISSIONS });
}

/**
 * POST /api/roles — Create a new custom role
 */
export async function POST(req: Request) {
    const authResult = await requirePermission(PERMISSIONS.ROLES_CREATE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    const body = await req.json();

    const parsed = CreateRoleSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    // Prevent creating duplicate role names
    await connectDB();
    const existing = await Role.findOne({
        gymId: session.user.gymId,
        name: parsed.data.name.toLowerCase(),
    });

    if (existing) {
        return NextResponse.json(
            { message: `Role "${parsed.data.name}" already exists` },
            { status: 409 }
        );
    }

    // Prevent creating system role names
    const reservedNames = ["owner", "manager", "trainer", "receptionist"];
    if (reservedNames.includes(parsed.data.name.toLowerCase())) {
        return NextResponse.json(
            { message: `"${parsed.data.name}" is a reserved system role name` },
            { status: 400 }
        );
    }

    const role = await Role.create({
        ...parsed.data,
        name: parsed.data.name.toLowerCase(),
        gymId: session.user.gymId,
        isSystemRole: false,
    });

    // Audit
    await logAudit({
        ...createCrudAuditEntry(
            session,
            "create",
            "role",
            role._id.toString(),
            role.name,
            { permissions: parsed.data.permissions },
            req.headers
        ),
    });

    return NextResponse.json({ role }, { status: 201 });
}
