import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema(
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
        type: {
            type: String,
            enum: ["image", "video", "svg", "document", "other"],
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
        publicId: {
            type: String,
            required: true,
        },
        folderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssetFolder",
            default: null,
        },
        size: {
            type: Number, // In bytes
        },
        metadata: {
            width: Number,
            height: Number,
            duration: Number, // For videos
            format: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

AssetSchema.index({ gymId: 1, folderId: 1 });
AssetSchema.index({ name: "text" });

export default mongoose.models.Asset || mongoose.model("Asset", AssetSchema);
