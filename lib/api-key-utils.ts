import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * generateApiKeyPair()
 * 
 * Returns: { rawKey, rawSecret, hashedKey, hashedSecret }
 */
export async function generateApiKeyPair() {
    // Generate raw keys
    const keyId = `gms_${crypto.randomBytes(8).toString("hex")}`;
    const rawKey = crypto.randomBytes(32).toString("hex");
    const rawSecret = crypto.randomBytes(32).toString("hex");

    // Hash for database storage
    const saltRounds = 10;
    const hashedKey = await bcrypt.hash(rawKey, saltRounds);
    const hashedSecret = await bcrypt.hash(rawSecret, saltRounds);

    return {
        keyId,
        rawKey,
        rawSecret,
        hashedKey,
        hashedSecret
    };
}

/**
 * verifyApiKey(providedKey, hashedKey)
 */
export async function verifyApiKey(provided: string, hashed: string) {
    return await bcrypt.compare(provided, hashed);
}
