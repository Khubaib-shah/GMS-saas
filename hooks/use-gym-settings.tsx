"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface GeneralSettings {
    name: string;
    logo: string;
    address: string;
    timezone: string;
    currency: string;
}

interface BusinessSettings {
    taxPercentage: number;
    joiningFee: number;
    autoExpireDays: number;
    gracePeriodDays: number;
}

interface NotificationSettings {
    sendExpiryReminder: boolean;
    sendInvoiceEmail: boolean;
    sendSMS: boolean;
}

interface ModuleSettings {
    trainersEnabled: boolean;
    attendanceEnabled: boolean;
}

export interface GymSettingsData {
    general: GeneralSettings;
    business: BusinessSettings;
    notifications: NotificationSettings;
    modules: ModuleSettings;
}

interface SubscriptionPlanData {
    tierName: string;
    active: boolean;
    expiresAt: string | null;
    enabledFeatures: string[];
}

interface GymContextValue {
    settings: GymSettingsData | null;
    subscription: SubscriptionPlanData | null;
    loading: boolean;
    error: string | null;
    refetchSettings: () => Promise<void>;
    hasFeature: (featureKey: string) => boolean;
    hasModule: (moduleKey: keyof ModuleSettings) => boolean;
}

const GymContext = createContext<GymContextValue>({
    settings: null,
    subscription: null,
    loading: true,
    error: null,
    refetchSettings: async () => { },
    hasFeature: () => false,
    hasModule: () => false,
});

// ─────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────

export function GymProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [settings, setSettings] = useState<GymSettingsData | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionPlanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        if (status !== "authenticated") return;

        try {
            setLoading(true);
            setError(null);

            const [generalRes, businessRes, notifRes] = await Promise.all([
                fetch("/api/settings/general"),
                fetch("/api/settings/business"),
                fetch("/api/settings/notifications"),
            ]);

            if (generalRes.ok && businessRes.ok && notifRes.ok) {
                const [general, business, notif] = await Promise.all([
                    generalRes.json(),
                    businessRes.json(),
                    notifRes.json(),
                ]);

                setSettings({
                    general: general.general,
                    business: business.business,
                    notifications: notif.notifications,
                    modules: { trainersEnabled: true, attendanceEnabled: true }, // defaults until we fetch
                });
            }
        } catch (err: any) {
            setError(err.message || "Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchSettings();
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status, fetchSettings]);

    /**
     * Check if a feature is enabled on the gym's subscription plan.
     * If no subscription data is loaded, defaults to the gym's isPremium flag from session.
     */
    const hasFeature = useCallback((featureKey: string): boolean => {
        if (subscription) {
            if (!subscription.active) return false;
            if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) return false;
            return subscription.enabledFeatures.includes(featureKey);
        }
        // Fallback: if we don't have subscription data, use isPremium from session
        const user = (session?.user as any);
        return !!user?.isPremium;
    }, [subscription, session]);

    /**
     * Check if a module is enabled in gym settings.
     */
    const hasModule = useCallback((moduleKey: keyof ModuleSettings): boolean => {
        if (!settings) return true; // Default to enabled until settings load
        return settings.modules[moduleKey] ?? true;
    }, [settings]);

    return (
        <GymContext.Provider
            value={{
                settings,
                subscription,
                loading,
                error,
                refetchSettings: fetchSettings,
                hasFeature,
                hasModule,
            }}
        >
            {children}
        </GymContext.Provider>
    );
}

// ─────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────

export function useGymSettings() {
    const context = useContext(GymContext);
    if (!context) {
        throw new Error("useGymSettings must be used within a GymProvider");
    }
    return context;
}

export default GymContext;
