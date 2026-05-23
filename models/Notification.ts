import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    gymId: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    
    // Who should see this?
    targetRoles: [{ type: String, enum: ["admin", "staff", "trainer", "owner", "super_admin"] }],
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If targeted to a specific user
    
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["order_placed", "subscription_expiring", "system_alert", "info"], default: "info" },
    
    // Optional link for the user to click
    link: { type: String },

    // Users who have clicked/read the notification
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]

}, { timestamps: true });

NotificationSchema.index({ gymId: 1, createdAt: -1 });
NotificationSchema.index({ targetRoles: 1 });
NotificationSchema.index({ targetUserId: 1 });

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
