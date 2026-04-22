import connectDB from "@/lib/db";
import Gym from "@/models/Gym";
import GymSettings from "@/models/GymSettings";
import PlatformPlan from "@/models/PlatformPlan";

export const subscriptionService = {
    /**
     * Reusable function to check and explicitly update a gym's status 
     * if its trial or active subscription has expired.
     */
    async checkAndUpdateGymSubscriptionStatus(gymId: string) {
        await connectDB();
        const gym = await Gym.findById(gymId);
        if (!gym) return null;

        let needsUpdate = false;
        const now = new Date();

        if (gym.subscriptionStatus === "trial" && gym.trialEndsAt && new Date(gym.trialEndsAt) < now) {
            gym.subscriptionStatus = "expired";
            needsUpdate = true;
        } else if (gym.subscriptionStatus === "active" && gym.expiryDate && new Date(gym.expiryDate) < now) {
            gym.subscriptionStatus = "expired";
            needsUpdate = true;
        }

        if (needsUpdate) {
            await gym.save();
        }

        return gym;
    },

    /**
     * Executes bulk update to find and transition all elapsed trials 
     * and active subscriptions to expired status. Daily Cron uses this.
     */
    async processDailyExpirations() {
        await connectDB();
        const now = new Date();

        // Expire trials that have elapsed
        const trialResult = await Gym.updateMany(
            { 
                subscriptionStatus: "trial", 
                trialEndsAt: { $lt: now } 
            },
            { $set: { subscriptionStatus: "expired" } }
        );

        // Expire active subscriptions that have elapsed
        const activeResult = await Gym.updateMany(
            { 
                subscriptionStatus: "active", 
                expiryDate: { $lt: now } 
            },
            { $set: { subscriptionStatus: "expired" } }
        );

        return {
            expiredTrials: trialResult.modifiedCount,
            expiredActive: activeResult.modifiedCount
        };
    },

    /**
     * Fetches the feature profile for a gym, combining plan-level 
     * allowed features and gym-level enabled modules.
     */
    async getGymFeatureProfile(gymId: string) {
        await connectDB();
        const gym = await Gym.findById(gymId).populate("platformPlanId");
        if (!gym) return null;

        const settings = await GymSettings.findOne({ gymId });
        
        const planFlags = (gym.platformPlanId as any)?.featureFlags || [];
        const modules = settings?.modules || {};

        return {
            planFlags,
            modules
        };
    }
};
