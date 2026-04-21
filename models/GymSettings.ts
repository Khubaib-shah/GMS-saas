import mongoose from "mongoose";

/**
 * GymSettings - Tenant-level configuration (one document per gym).
 * Separated from the Gym model to keep settings updates auditable and atomic.
 */
const GymSettingsSchema = new mongoose.Schema(
    {
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
            unique: true,
        },
        general: {
            name: { type: String, default: "" },
            logo: { type: String, default: "" },
            address: { type: String, default: "" },
            phone: { type: String, default: "" },
            timezone: { type: String, default: "UTC" },
            currency: { type: String, default: "USD" },
        },
        business: {
            taxPercentage: { type: Number, default: 0 },
            joiningFee: { type: Number, default: 0 },
            autoExpireDays: { type: Number, default: 0 },
            gracePeriodDays: { type: Number, default: 0 },
        },
        notifications: {
            sendExpiryReminder: { type: Boolean, default: true },
            sendInvoiceEmail: { type: Boolean, default: false },
            sendSMS: { type: Boolean, default: false },
        },
        modules: {
            trainersEnabled: { type: Boolean, default: true },
            attendanceEnabled: { type: Boolean, default: true },
        },
    },
    { timestamps: true }
);

GymSettingsSchema.index({ gymId: 1 });

GymSettingsSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.GymSettings ||
    mongoose.model("GymSettings", GymSettingsSchema);
