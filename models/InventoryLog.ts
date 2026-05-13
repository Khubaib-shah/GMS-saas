import mongoose from "mongoose";

/**
 * InventoryLog — Tracks all changes to product stock levels.
 * Critical for auditing and inventory management.
 */
const InventoryLogSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId }, // Optional, if change was to a specific variant
    
    type: { 
        type: String, 
        enum: ["adjustment", "sale", "restock", "return", "damage", "expired"],
        required: true 
    },
    
    quantityChange: { type: Number, required: true }, // positive for restock, negative for sale/damage
    previousQuantity: { type: Number, required: true },
    newQuantity: { type: Number, required: true },
    
    reason: { type: String },
    referenceId: { type: String }, // e.g., Order ID, Purchase Order ID
    
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    metadata: { type: Map, of: String }
}, { timestamps: true });

InventoryLogSchema.index({ gymId: 1, productId: 1, createdAt: -1 });
InventoryLogSchema.index({ gymId: 1, type: 1 });

export default mongoose.models.InventoryLog || mongoose.model("InventoryLog", InventoryLogSchema);
