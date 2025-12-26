import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
    {
        memberId: { type: String, required: true },
        planId: { type: String, required: true },
        startDate: { type: String, required: true },
        endDate: { type: String, required: true },
        status: { type: String, enum: ["active", "expired", "paused"], default: "active" },
        paymentId: { type: String },
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    },
    { timestamps: true }
);

SubscriptionSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.mongoId = doc._id.toString();
        ret.id = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema);
