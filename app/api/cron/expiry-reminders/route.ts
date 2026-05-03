import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Subscription from "@/models/Subscription";
import Member from "@/models/Member";
import GymSettings from "@/models/GymSettings";
import { sendEmail } from "@/lib/mail-service";
import { EmailTemplates } from "@/lib/email-templates";

/**
 * CRON: Membership Expiry Reminders
 * Triggered by external cron service to notify members before their sub ends.
 * Security: Verified via CRON_SECRET header.
 */

export async function GET(req: Request) {
    // 1. Security Check
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // 2. Define the "Soon" window (Exactly 3 days from now)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // 3. Find subscriptions expiring on targetDate
        const expiringSubs = await Subscription.find({
            endDate: { $gte: targetDate, $lt: nextDay },
            status: "active",
            deletedAt: null
        }).lean();

        console.log(`[CRON] Found ${expiringSubs.length} subscriptions expiring on ${targetDate.toLocaleDateString()}`);

        let sentCount = 0;
        let skippedCount = 0;

        // 4. Process notifications
        const Gym = require("@/models/Gym").default;
        for (const sub of expiringSubs) {
            const [member, settings, gym] = await Promise.all([
                Member.findById(sub.memberId).lean(),
                GymSettings.findOne({ gymId: sub.gymId }).lean(),
                Gym.findById(sub.gymId).select("name").lean()
            ]);

            if (settings?.notifications?.sendExpiryReminder && member?.email) {
                const html = EmailTemplates.expiryReminder({
                    memberName: member.firstName,
                    planName: sub.planId.replace("plan_", "").toUpperCase(),
                    expiryDate: sub.endDate,
                    gymName: gym?.name || "Our Gym",
                    daysRemaining: 3
                });

                await sendEmail({
                    to: member.email,
                    subject: `Membership Reminder: 3 Days Remaining - ${gym?.name || 'GymFlow'}`,
                    html,
                    gymId: sub.gymId.toString()
                });
                sentCount++;
            } else {
                skippedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            processed: expiringSubs.length,
            sent: sentCount,
            skipped: skippedCount
        });

    } catch (error: any) {
        console.error("[CRON ERROR] Expiry Reminders failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
