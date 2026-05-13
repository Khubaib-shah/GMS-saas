import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import ApiKey from "@/models/ApiKey";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * DELETE /api/selling/api-keys/[id]
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.API_KEYS_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();

        const key = await ApiKey.findOne({
            _id: id,
            gymId: session.user.gymId
        });

        if (!key) {
            return NextResponse.json({ error: "API Key not found" }, { status: 404 });
        }

        await ApiKey.deleteOne({ _id: id });

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "delete",
                "api_key",
                key._id.toString(),
                key.name,
                { action: "deleted" },
                req.headers
            )
        );

        return NextResponse.json({ message: "API Key deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
