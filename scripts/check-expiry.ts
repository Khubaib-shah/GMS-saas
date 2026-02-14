import connectDB from "../lib/db";
import Subscription from "../models/Subscription";
import Member from "../models/Member";
import { logAudit } from "../lib/audit";

/**
 * script to check for expired memberships and update their status
 * This can be run as a cron job or a serverless function
 */
async function checkExpiredMemberships() {
    console.log("🚀 Starting membership expiry check...");

    try {
        await connectDB();

        const today = new Date().toISOString();

        // 1. Find all active subscriptions that have passed their end date
        const expiredSubscriptions = await Subscription.find({
            status: "active",
            endDate: { $lt: today },
            deletedAt: null
        });

        console.log(`📊 Found ${expiredSubscriptions.length} subscriptions to expire.`);

        for (const sub of expiredSubscriptions) {
            // Update subscription status
            sub.status = "expired";
            await sub.save();

            // Log audit
            await logAudit({
                gymId: sub.gymId.toString(),
                userId: "SYSTEM",
                action: "update",
                resource: "subscription",
                resourceId: sub._id.toString(),
                details: { autoExpired: true, endDate: sub.endDate }
            });

            console.log(`✅ Expired subscription ${sub._id} for member ${sub.memberId}`);
        }

        console.log("🏁 Expiry check completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error during expiry check:", error);
        process.exit(1);
    }
}

checkExpiredMemberships();
