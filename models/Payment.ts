import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
    {
        memberId: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        // Expanded payment methods
        method: {
            type: String,
            enum: ["cash", "online", "bank_transfer", "card", "other"],
            required: true
        },
        description: { type: String },
        receiptUrl: { type: String },
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
        // New fields for enhanced payment tracking
        receiptNumber: { type: String }, // Auto-generated or manual
        collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff who collected
        notes: { type: String },
        // Multi-branch support
        branchId: { type: mongoose.Schema.Types.ObjectId },
        // Soft delete support
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

PaymentSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
