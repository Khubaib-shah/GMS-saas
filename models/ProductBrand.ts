import mongoose from "mongoose";

const ProductBrandSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    logo: {
        url: String,
        publicId: String
    },
    description: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductBrandSchema.index({ gymId: 1, slug: 1 }, { unique: true });

export default mongoose.models.ProductBrand || mongoose.model("ProductBrand", ProductBrandSchema);
