import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import ApiKey from "@/models/ApiKey";
import GymSettings from "@/models/GymSettings";
import SubscriptionPlan from "@/models/SubscriptionPlan";
import Gym from "@/models/Gym";
import { verifyApiKey } from "@/lib/api-key-utils";

/**
 * validatePublicApiKey()
 * 
 * Middleware-like helper for public store APIs.
 * Verifies X-Key-ID, X-API-Key, and X-API-Secret headers.
 */
export async function validatePublicApiKey(req: Request) {
    Gym.init();

    const keyId = req.headers.get("X-Key-ID");
    const providedKey = req.headers.get("X-API-Key");
    const providedSecret = req.headers.get("X-API-Secret");

    if (!keyId || !providedKey || !providedSecret) {
        return { error: NextResponse.json({ error: "Missing API credentials (X-Key-ID, X-API-Key, X-API-Secret required)" }, { status: 401 }) };
    }

    try {
        await connectDB();

        // 1. Find the key by its searchable ID
        const keyDoc = await ApiKey.findOne({ keyId, isActive: true });
        if (!keyDoc) {
            return { error: NextResponse.json({ error: "Invalid or inactive API Key ID" }, { status: 401 }) };
        }

        // 2. Verify Key and Secret
        const isKeyValid = await verifyApiKey(providedKey, keyDoc.key);
        const isSecretValid = await verifyApiKey(providedSecret, keyDoc.secret);

        if (!isKeyValid || !isSecretValid) {
            return { error: NextResponse.json({ error: "Invalid API Key or Secret" }, { status: 401 }) };
        }

        // 3. Check if selling module is enabled for this gym via GymSettings or SubscriptionPlan
        const gymIdStr = keyDoc.gymId.toString();
        const [settings, subPlan] = await Promise.all([
            GymSettings.findOne({ $or: [{ gymId: keyDoc.gymId }, { gymId: gymIdStr }] }).lean(),
            SubscriptionPlan.findOne({ gymId: gymIdStr, active: true }).lean()
        ]);

        const hasSellingEnabled = 
            (settings as any)?.modules?.sellingEnabled || 
            (subPlan as any)?.enabledFeatures?.includes("selling") || 
            (subPlan as any)?.enabledFeatures?.includes("commerce");

        if (!hasSellingEnabled) {
            return { error: NextResponse.json({ error: "Selling module is not enabled for this gym" }, { status: 403 }) };
        }

        // 4. Update usage stats (fire and forget for performance)
        ApiKey.updateOne(
            { _id: keyDoc._id },
            { 
                $inc: { usageCount: 1 },
                $set: { lastUsedAt: new Date() }
            }
        ).catch(console.error);

        return { gymId: keyDoc.gymId, permissions: keyDoc.permissions };

    } catch (error: any) {
        console.error("Public API Auth Error:", error);
        return { 
            error: NextResponse.json({ 
                error: "Authentication failed", 
                details: error?.message || String(error) 
            }, { status: 401 }) 
        };
    }
}
