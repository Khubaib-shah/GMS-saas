import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String },
    userRole: { type: String },
    action: { type: String, required: true }, // e.g., "create", "update", "login"
    resource: { type: String, required: true }, // e.g., "member", "payment"
    resourceId: { type: String },
    resourceName: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

// Index for performance and tenant isolation
AuditLogSchema.index({ gymId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
