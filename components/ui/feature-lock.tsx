"use client";

import React from "react";
import { Lock } from "lucide-react";
import { WhatsAppUpgradeButton } from "./whatsapp-upgrade-button";
import { cn } from "@/lib/utils";

interface FeatureLockProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
    containerClassName?: string;
}

export function FeatureLock({
    title,
    description,
    icon,
    action,
    className,
    containerClassName,
}: FeatureLockProps) {
    return (
        <div className={cn(
            "glass-premium p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4 h-full min-h-full",
            containerClassName
        )}>
            <div className={cn(
                "w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center",
                className
            )}>
                {icon || <Lock className="w-6 h-6 text-amber-600" />}
            </div>
            <div className="space-y-2">
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                    {description}
                </p>
            </div>
            {action === undefined ? <WhatsAppUpgradeButton /> : action}
        </div>
    );
}
