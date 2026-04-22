"use client";

import React from "react";
import { useFeature, FeatureKey } from "@/hooks/use-feature";
import { PremiumFeatureCard } from "./premium-feature-card";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: "hide" | "lock";
  variant?: "component" | "page";
  title?: string;
  description?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  mode,
  variant = "component",
  title,
  description = "Upgrade your plan to unlock this and many other advanced management features.",
}) => {
  const { status } = useFeature(feature);
  
  // If variant is "page", we default to "lock" mode to show the upsell
  // If variant is "component", we default to "hide" mode
  const activeMode = mode || (variant === "page" ? "lock" : "hide");

  if (status === "active") {
    return <>{children}</>;
  }

  if (status === "locked" && activeMode === "lock") {
    return (
      <div className={cn(variant === "page" ? "min-h-[60vh] flex items-center justify-center p-6" : "")}>
        <PremiumFeatureCard 
          title={title || feature.charAt(0).toUpperCase() + feature.slice(1)} 
          description={description}
        />
      </div>
    );
  }

  // If status is hidden, or locked in hide mode
  return <>{fallback || null}</>;
};
