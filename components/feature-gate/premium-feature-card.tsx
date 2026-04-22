"use client";

import React from "react";
import { Lock, Crown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PremiumFeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const PremiumFeatureCard: React.FC<PremiumFeatureCardProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-8 text-center backdrop-blur-md">
      {/* Decorative Gradient */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
      
      <div className="relative flex flex-col items-center justify-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
          {icon || <Crown className="h-10 w-10 text-primary" />}
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-white uppercase italic font-mono">
            Premium Feature
          </h3>
          <p className="mx-auto max-w-sm text-muted-foreground">
            The <span className="text-white font-semibold">{title}</span> module is not included in your current plan. 
            {description}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            className="group relative overflow-hidden bg-primary px-8 hover:bg-primary/90"
            onClick={() => window.location.href = "mailto:support@gms.com"}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Support to Upgrade
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-medium">
          <Lock className="h-3 w-3" />
          Enterprise Tier Only
        </div>
      </div>
    </div>
  );
};
