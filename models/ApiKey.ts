import mongoose from "mongoose";

/**
 * ApiKey — Managed keys for gyms to access their products from external sites.
 */
const ApiKeySchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    name: { type: String, required: true }, // e.g., "Main Website", "Mobile App"
    keyId: { type: String, required: true, unique: true }, // Searchable identifier (gms_...)
    
    key: { type: String, required: true, unique: true }, // Hashed key
    secret: { type: String, required: true }, // Hashed secret
    
    permissions: [{ type: String }], // e.g., ["store:read", "inventory:read"]
    
    rateLimit: { type: Number, default: 100 }, // requests per minute
    ipWhitelist: [{ type: String }], // optional
    
    isActive: { type: Boolean, default: true },
    lastUsedAt: { type: Date },
    usageCount: { type: Number, default: 0 },
    
    expiresAt: { type: Date }
}, { timestamps: true });

ApiKeySchema.index({ gymId: 1, isActive: 1 });
ApiKeySchema.index({ key: 1 });

export default mongoose.models.ApiKey || mongoose.model("ApiKey", ApiKeySchema);
