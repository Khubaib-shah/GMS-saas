import { NextResponse } from "next/server";
import { requirePermission, checkFeature } from "@/lib/api-middleware";
import { PERMISSIONS } from "@/lib/permissions";
import connectDB from "@/lib/db";
import ApiKey from "@/models/ApiKey";
import { generateApiKeyPair } from "@/lib/api-key-utils";
import { logAudit, createCrudAuditEntry } from "@/lib/audit";

/**
 * GET /api/selling/api-keys
 */
export async function GET(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.API_KEYS_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        await connectDB();
        const keys = await ApiKey.find({ gymId: session.user.gymId })
            .select("-secret") // Never return hashed secret
            .sort({ createdAt: -1 });
            
        return NextResponse.json(keys);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/selling/api-keys
 */
export async function POST(req: Request) {
    const featureResult = await checkFeature("selling");
    if ("error" in featureResult) return featureResult.error;

    const authResult = await requirePermission(PERMISSIONS.API_KEYS_MANAGE);
    if ("error" in authResult) return authResult.error;
    const { session } = authResult;

    try {
        const { name, permissions } = await req.json();
        
        await connectDB();

        const { keyId, rawKey, rawSecret, hashedKey, hashedSecret } = await generateApiKeyPair();

        const apiKeyDoc = new ApiKey({
            gymId: session.user.gymId,
            name,
            keyId,
            key: hashedKey,
            secret: hashedSecret,
            permissions: permissions || ["store:read"],
            isActive: true
        });
        await apiKeyDoc.save();

        // Audit Log
        await logAudit(
            createCrudAuditEntry(
                session,
                "create",
                "api_key",
                apiKeyDoc._id.toString(),
                apiKeyDoc.name,
                { keyId: apiKeyDoc.keyId },
                req.headers
            )
        );

        // RETURN RAW KEY AND SECRET ONLY ONCE
        return NextResponse.json({
            id: apiKeyDoc._id,
            name: apiKeyDoc.name,
            keyId,
            apiKey: rawKey,
            apiSecret: rawSecret,
            message: "IMPORTANT: Save these credentials now. They will never be shown again."
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
