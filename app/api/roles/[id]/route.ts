import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Role from "@/models/Role";
import { requirePermission, buildGymQuery } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import { UpdateRoleSchema } from "@/lib/validations";
import { logAudit, createCrudAuditEntry, createUpdateDiff } from "@/lib/audit";

/**
 * PUT /api/roles/[id] — Update an existing role
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.ROLES_EDIT);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    const { id } = await params;
    const body = await req.json();

    const parsed = UpdateRoleSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation error", errors: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }

    await connectDB();

    const role = await Role.findOne({ _id: id, gymId: session.user.gymId });
    if (!role) {
        return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // Owner role permissions cannot be downgraded
    if (role.isSystemRole && role.name === "owner" && parsed.data.permissions) {
        return NextResponse.json(
            { message: "Owner role permissions cannot be modified" },
            { status: 403 }
        );
    }

    // Prevent renaming system roles
    if (role.isSystemRole && parsed.data.name && parsed.data.name !== role.name) {
        return NextResponse.json(
            { message: "System role names cannot be changed" },
            { status: 403 }
        );
    }

    const oldRole = role.toJSON();

    if (parsed.data.name) role.name = parsed.data.name.toLowerCase();
    if (parsed.data.permissions) role.permissions = parsed.data.permissions;
    if (parsed.data.description !== undefined) role.description = parsed.data.description;

    await role.save();

    // Audit
    const diff = createUpdateDiff(oldRole, role.toJSON());
    await logAudit({
        ...createCrudAuditEntry(
            session,
            "update",
            "role",
            id,
            role.name,
            diff,
            req.headers
        ),
        action: "permission_change",
    });

    return NextResponse.json({ role });
}

/**
 * DELETE /api/roles/[id] — Delete a custom role (system roles cannot be deleted)
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requirePermission(PERMISSIONS.ROLES_DELETE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;
    const { id } = await params;

    await connectDB();

    const role = await Role.findOne({ _id: id, gymId: session.user.gymId });
    if (!role) {
        return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    // System roles cannot be deleted
    if (role.isSystemRole) {
        return NextResponse.json(
            { message: `System role "${role.name}" cannot be deleted` },
            { status: 403 }
        );
    }

    await Role.deleteOne({ _id: id });

    // Audit
    await logAudit({
        ...createCrudAuditEntry(
            session,
            "delete",
            "role",
            id,
            role.name,
            { permissions: role.permissions },
            req.headers
        ),
    });

    return NextResponse.json({ message: "Role deleted" });
}
