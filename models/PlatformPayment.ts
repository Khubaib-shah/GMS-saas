import mongoose from "mongoose";

/**
 * PlatformPayment — Manual billing records for gym subscriptions.
 * Entered by Super Admin. All amounts in PKR.
 */
const PlatformPaymentSchema = new mongoose.Schema(
    {
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PlatformPlan",
            default: null,
        },
        planName: { type: String, default: "" },
        amountPKR: { type: Number, required: true },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "jazzcash", "easypaisa", "other"],
            default: "cash",
        },
        paymentDate: { type: Date, required: true },
        expiryDate: { type: Date, required: true },
        notes: { type: String, default: "" },
        enteredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

PlatformPaymentSchema.index({ gymId: 1, paymentDate: -1 });
PlatformPaymentSchema.index({ expiryDate: 1 });

PlatformPaymentSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
    },
});

export default mongoose.models.PlatformPayment ||
    mongoose.model("PlatformPayment", PlatformPaymentSchema);
