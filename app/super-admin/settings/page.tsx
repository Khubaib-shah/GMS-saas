"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, Settings, Shield, Globe, Bell } from "lucide-react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard-header";

export default function PlatformSettingsPage() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/super-admin/settings")
            .then((r) => r.json())
            .then((d) => setSettings(d.settings))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/super-admin/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error("Failed to save");
            toast.success("Platform settings saved");
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };



    return (
        <div className="space-y-6 max-w-4xl animate-fade-in">
            <DashboardHeader
                title="PLATFORM"
                highlight="SETTINGS"
                subtitle="ADMIN: CORE_CONFIG_v5"
                description="Global configuration for the SaaS platform"
            >
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-[38px] flex items-center justify-center px-8 rounded-xl bg-primary text-black hover:bg-white font-black tracking-tighter neon-glow transition-all group gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "SAVING..." : "SAVE CHANGES"}
                </button>
            </DashboardHeader>

            {/* Subscription Settings */}
            <Section icon={Shield} title="Subscription Settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Default Trial Duration (Days)">
                        <input
                            type="number"
                            min="0"
                            value={settings?.defaultTrialDays || 14}
                            onChange={(e) => setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value) || 14 })}
                            className="settings-input"
                        />
                    </Field>
                </div>
            </Section>

            {/* Feature Flags */}
            <Section icon={Settings} title="Feature Flags">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Toggle
                        label="Trainers Module"
                        checked={settings?.featureFlags?.trainersModule ?? true}
                        onChange={(v) => setSettings({
                            ...settings,
                            featureFlags: { ...settings?.featureFlags, trainersModule: v },
                        })}
                    />
                    <Toggle
                        label="Diet Module"
                        checked={settings?.featureFlags?.dietModule ?? false}
                        onChange={(v) => setSettings({
                            ...settings,
                            featureFlags: { ...settings?.featureFlags, dietModule: v },
                        })}
                    />
                    <Toggle
                        label="Advanced Reports"
                        checked={settings?.featureFlags?.advancedReports ?? false}
                        onChange={(v) => setSettings({
                            ...settings,
                            featureFlags: { ...settings?.featureFlags, advancedReports: v },
                        })}
                    />
                </div>
            </Section>

            {/* Maintenance Mode */}
            <Section icon={Globe} title="System">
                <Toggle
                    label="Maintenance Mode"
                    description="When enabled, the platform shows a maintenance page to all gym users"
                    checked={settings?.maintenanceMode ?? false}
                    onChange={(v) => setSettings({ ...settings, maintenanceMode: v })}
                />
            </Section>

            <style jsx>{`
                .settings-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .settings-input:focus {
                    border-color: rgba(99, 102, 241, 0.5);
                }
            `}</style>
        </div>
    );
}

function Section({ icon: Icon, title, children }: any) {
    return (
        <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6 space-y-4">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">{label}</label>
            {children}
        </div>
    );
}

function Toggle({ label, description, checked, onChange }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-sm text-white font-medium">{label}</p>
                {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-white/[0.1]"
                    }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );
}
