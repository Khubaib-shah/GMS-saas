"use client";

import React, { ReactNode } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ConfirmModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    highlight?: string;
    description: ReactNode;
    onConfirm?: () => void;
    loading?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "primary" | "warning";
    icon?: LucideIcon;
    hideCancel?: boolean;
    customActions?: ReactNode;
}

export function ConfirmModal({
    open,
    onOpenChange,
    title,
    highlight,
    description,
    onConfirm,
    loading = false,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "destructive",
    icon: Icon = AlertTriangle,
    hideCancel = false,
    customActions
}: ConfirmModalProps) {
    const isDestructive = variant === "destructive";
    const isWarning = variant === "warning";
    const isPrimary = variant === "primary";

    const iconColor = isDestructive
        ? "text-destructive drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]"
        : isWarning
            ? "text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            : "text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]";

    const highlightColor = isDestructive
        ? "text-destructive"
        : isWarning
            ? "text-orange-500"
            : "text-primary/40";

    const buttonClass = isDestructive
        ? "bg-destructive text-white hover:bg-destructive/80"
        : isWarning
            ? "bg-orange-500 text-white hover:bg-orange-500/80"
            : "bg-primary text-black hover:bg-white";

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-background border-white/5 shadow-2xl">
                <AlertDialogHeader>
                    {Icon && (
                        <Icon className={cn("w-12 h-12 mb-4 mx-auto", iconColor)} />
                    )}
                    <AlertDialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white text-center flex items-center justify-center gap-2">
                        {title} {highlight && <span className={highlightColor}>{highlight}</span>}
                    </AlertDialogTitle>
                    <div className="text-slate-400 text-center font-medium italic">
                        {description}
                    </div>
                </AlertDialogHeader>
                
                <AlertDialogFooter className="mt-6">
                    {customActions ? (
                        customActions
                    ) : (
                        <>
                            {!hideCancel && (
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
                                    {cancelText}
                                </AlertDialogCancel>
                            )}
                            {onConfirm && (
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (onConfirm) onConfirm();
                                    }}
                                    disabled={loading}
                                    className={cn("rounded-xl font-black italic uppercase tracking-widest", buttonClass)}
                                >
                                    {loading ? `${cancelText === "Cancel" ? "Processing" : confirmText}...` : confirmText}
                                </AlertDialogAction>
                            )}
                        </>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
