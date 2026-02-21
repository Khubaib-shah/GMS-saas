import mongoose from "mongoose";

const ExerciseSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    name: { type: String, required: true },
    description: { type: String },
    muscleGroup: { type: String, required: true }, // Chest, Back, Legs, Shoulders, Arms, Core, Cardio
    equipment: { type: String }, // Barbell, Dumbbell, Machine, Bodyweight
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    tips: [{ type: String }],

    // Media
    svgUrl: { type: String }, // URL to SVG file (Cloudinary/S3)
    thumbnailUrl: { type: String },
    gifUrl: { type: String }, // Backwards compatibility for now

    createdByTrainerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isPublicWithinGym: { type: Boolean, default: true },
}, { timestamps: true });

// Indexing for performance and isolation
ExerciseSchema.index({ gymId: 1, name: 1 });
ExerciseSchema.index({ gymId: 1, muscleGroup: 1 });

export default mongoose.models.Exercise || mongoose.model("Exercise", ExerciseSchema);
