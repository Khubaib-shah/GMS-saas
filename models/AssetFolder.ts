import mongoose from "mongoose";

const AssetFolderSchema = new mongoose.Schema(
    {
        gymId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssetFolder",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

AssetFolderSchema.index({ gymId: 1, parentId: 1 });

export default mongoose.models.AssetFolder || mongoose.model("AssetFolder", AssetFolderSchema);
