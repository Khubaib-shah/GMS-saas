import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "TEMPLATE_CREATED", "PLAN_ASSIGNED"
    entityType: { type: String, required: true }, // e.g., "WorkoutTemplate", "AssignedWorkoutPlan"
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for performance and tenant isolation
AuditLogSchema.index({ gymId: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
