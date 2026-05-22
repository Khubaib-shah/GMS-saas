import mongoose from "mongoose";


const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    
    // memberId is optional. Staff might sell to a walk-in guest who is not registered.
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
    
    // The staff member who processed the order (if via POS)
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    items: [OrderItemSchema],
    
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    
    paymentMethod: { 
        type: String, 
        enum: ["cash", "card", "online", "member_credit", "other"], 
        required: true 
    },
    
    status: { 
        type: String, 
        enum: ["pending", "completed", "cancelled", "refunded"], 
        default: "completed" 
    },
    
    source: {
        type: String,
        enum: ["pos", "member_portal", "external_api"],
        required: true
    },
    
    receiptNumber: { type: String, unique: true, sparse: true },
    paymentReceiptUrl: { type: String }, // For online payments verification
    notes: { type: String }

}, { timestamps: true });

// Generate receipt number pre-save
OrderSchema.pre("save", async function () {
    if (!this.receiptNumber) {
        // Simple receipt generation: GYM-ORD-timestamp-random
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.receiptNumber = `ORD-${Date.now().toString().slice(-6)}-${randomStr}`;
    }
});

OrderSchema.index({ gymId: 1, createdAt: -1 });
OrderSchema.index({ gymId: 1, memberId: 1 });
OrderSchema.index({ receiptNumber: 1 });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
