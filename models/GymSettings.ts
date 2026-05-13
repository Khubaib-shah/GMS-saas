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
        business: {
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
            sellingEnabled: { type: Boolean, default: false },
        },
        email: {
            host: { type: String, default: "smtp.gmail.com" },
            port: { type: Number, default: 587 },
            secure: { type: Boolean, default: false },
            user: { type: String, default: "" },
            pass: { type: String, default: "" },
            fromName: { type: String, default: "" },
            fromEmail: { type: String, default: "" },
        },
    },
    { timestamps: true }
);


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
