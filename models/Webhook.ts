import mongoose from "mongoose";

const WebhookSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    url: { type: String, required: true },
    
    events: [{ 
        type: String, 
        enum: ["product.created", "product.updated", "product.deleted", "stock.updated", "stock.low", "order.created"] 
    }],
    
    secret: { type: String, required: true }, // Signing secret
    
    isActive: { type: Boolean, default: true },
    failCount: { type: Number, default: 0 },
    lastTriggeredAt: { type: Date }
}, { timestamps: true });

const WebhookLogSchema = new mongoose.Schema({
    webhookId: { type: mongoose.Schema.Types.ObjectId, ref: "Webhook", required: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    
    responseStatus: { type: Number },
    responseTime: { type: Number }, // in ms
    attempt: { type: Number, default: 1 },
    success: { type: Boolean, required: true },
    error: { type: String }
}, { timestamps: true });

WebhookSchema.index({ gymId: 1, isActive: 1 });
WebhookLogSchema.index({ webhookId: 1, createdAt: -1 });

export const Webhook = mongoose.models.Webhook || mongoose.model("Webhook", WebhookSchema);
export const WebhookLog = mongoose.models.WebhookLog || mongoose.model("WebhookLog", WebhookLogSchema);
