import mongoose from "mongoose";

/**
 * AuditLog - Tracks all critical system actions for accountability
 */
const AuditLogSchema = new mongoose.Schema(
    {
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        userName: { type: String }, // Denormalized for quick display
        action: {
            type: String,
            required: true,
            enum: [
                'create',
                'update',
                'delete',
                'login',
                'logout',
                'pause_subscription',
                'resume_subscription',
                'checkin',
                'checkout',
                'role_change',
                'export_data',
                'enable_portal',
                'disable_portal'
            ]
        },
        resource: {
            type: String,
            required: true,
            enum: [
                'member',
                'subscription',
                'payment',
                'plan',
                'attendance',
                'user',
                'branch',
                'settings',
                'gym',
                'trainer_profile'
            ]
        },
        resourceId: { type: String },
        resourceName: { type: String }, // Denormalized for display (e.g., member name)
        details: { type: mongoose.Schema.Types.Mixed }, // JSON object for before/after or extra info
        ipAddress: { type: String },
        userAgent: { type: String },
        branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" }, // Optional branch context
    },
    { timestamps: true }
);

// Indexes for efficient querying
AuditLogSchema.index({ gymId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });

AuditLogSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
