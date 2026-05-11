import mongoose from "mongoose";

/**
 * ProductVariant — Support for advanced variants like Size, Color, Flavor.
 */
const ProductVariantSchema = new mongoose.Schema({
    name: { type: String, required: true }, // "Chocolate / 1kg"
    attributes: { type: Map, of: String },  // { flavor: "Chocolate", weight: "1kg" }
    sku: { type: String },
    price: { type: Number },
    discountPrice: { type: Number },
    stockQuantity: { type: Number, default: 0 },
    images: [{
        url: String,
        publicId: String
    }],
    status: { type: String, enum: ["active", "inactive"], default: "active" }
}, { _id: true });

/**
 * Product — Core model for the Selling Module.
 */
const ProductSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    shortDescription: { type: String },
    description: { type: String }, // Rich text

    // Media
    images: [{
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String },
        sortOrder: { type: Number, default: 0 }
    }],
    thumbnail: {
        url: String,
        publicId: String
    },

    // Classification
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" },
    brandId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBrand" },
    tags: [{ type: String }],

    // Pricing
    price: { type: Number, required: true },
    costPrice: { type: Number },
    discountPrice: { type: Number },
    taxRate: { type: Number, default: 0 },

    // Inventory
    sku: { type: String },
    barcode: { type: String },
    stockQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    trackInventory: { type: Boolean, default: true },

    // Physical
    weight: { type: Number }, // in grams/kg
    dimensions: {
        length: Number,
        width: Number,
        height: Number
    },

    // Perishable/Batch
    expiryDate: { type: Date },
    batchNumber: { type: String },

    // Supplier Info
    supplierName: { type: String },
    supplierContact: { type: String },

    // SEO
    seoTitle: { type: String },
    seoDescription: { type: String },
    searchKeywords: [{ type: String }],

    // Status
    status: { 
        type: String, 
        enum: ["active", "draft", "archived"], 
        default: "draft" 
    },
    isFeatured: { type: Boolean, default: false },
    visibility: { type: String, enum: ["public", "private"], default: "public" },

    // Nutritional (Specific to Gym SaaS supplements)
    nutritionalInfo: {
        servingSize: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        ingredients: [{ type: String }]
    },

    variants: [ProductVariantSchema],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Multi-tenant isolation and search indexes
ProductSchema.index({ gymId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ gymId: 1, status: 1 });
ProductSchema.index({ gymId: 1, categoryId: 1 });
ProductSchema.index({ gymId: 1, sku: 1 });
ProductSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
