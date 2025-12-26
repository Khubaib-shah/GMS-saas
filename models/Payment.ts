import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
    {
        memberId: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: String, required: true },
        method: { type: String, enum: ["cash", "online"], required: true },
        description: { type: String },
        receiptUrl: { type: String },
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
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
