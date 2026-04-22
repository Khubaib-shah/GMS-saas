import { useSession } from "next-auth/react";

export type FeatureKey = 
  | "members" 
  | "subscriptions" 
  | "payments" 
  | "attendance" 
  | "trainers" 
  | "workoutPlans" 
  | "auditLogs" 
  | "multiBranch";

export function useFeature(feature: FeatureKey) {
  const { data: session } = useSession();
  const user = session?.user as any;

  if (!user) return { isAllowed: false, isEnabled: false, status: "hidden" as const };

  // Super Admin has access to everything
  if (user.role === "super_admin") {
    return { isAllowed: true, isEnabled: true, status: "active" as const };
  }

  const isAllowed = user.featureFlags?.includes(feature) || false;
  const isEnabled = user.modules?.[feature] ?? true; // Default to true if not specified

  let status: "active" | "locked" | "hidden" = "hidden";

  if (isAllowed && isEnabled) {
    status = "active";
  } else if (!isAllowed) {
    status = "locked"; // Allowed by plan? No -> Locked (Upsell)
  } else if (!isEnabled) {
    status = "hidden"; // Allowed by plan but disabled by owner -> Hide
  }

  return {
    isAllowed,
    isEnabled,
    status
  };
}
