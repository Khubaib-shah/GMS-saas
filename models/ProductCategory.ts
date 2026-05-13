import mongoose from "mongoose";

const ProductCategorySchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    image: {
        url: String,
        publicId: String
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory", default: null },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

ProductCategorySchema.index({ gymId: 1, slug: 1 }, { unique: true });
ProductCategorySchema.index({ gymId: 1, parentId: 1 });

export default mongoose.models.ProductCategory || mongoose.model("ProductCategory", ProductCategorySchema);
