import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema(
    {
        id: { type: String, required: true }, // Not globally unique anymore
        gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        duration: { type: Number, required: true }, // days
        description: { type: String },
    },
    { timestamps: true }
);

// Compound index to ensure ID is unique PER GYM
PlanSchema.index({ id: 1, gymId: 1 }, { unique: true });

PlanSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret: any) {
        ret.mongoId = doc._id.toString();
        delete ret._id;
    },
});

export default mongoose.models.Plan || mongoose.model("Plan", PlanSchema);
