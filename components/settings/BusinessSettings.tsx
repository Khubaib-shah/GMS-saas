"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, DollarSign, Calculator, Settings2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BusinessSettings() {
    const { data: session, update: updateSession } = useSession();
    const user = session?.user as any;

    const [data, setData] = useState({
        taxPercentage: 0,
        joiningFee: 0,
        autoExpireDays: 0,
        gracePeriodDays: 0,
    });
    const [modules, setModules] = useState<Record<string, boolean>>({
        trainers: true,
        attendance: true,
        workoutPlans: true,
        payments: true,
        auditLogs: true,
        multiBranch: false,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const CACHE_KEY = "gms_business_settings_cache";

    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setData(parsed.business || parsed);
                if (parsed.modules) setModules(parsed.modules);
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached business settings", e);
            }
        }

        fetch("/api/settings/business")
            .then(res => res.json())
            .then(res => {
                if (res.business) {
                    setData(res.business);
                    if (res.modules) setModules(res.modules);
                    localStorage.setItem(CACHE_KEY, JSON.stringify({ business: res.business, modules: res.modules }));
                }
            })
            .catch(() => toast.error("Failed to load business settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/business", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, modules }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            
            localStorage.setItem(CACHE_KEY, JSON.stringify({ business: data, modules }));
            
            // Refresh session to reflect changes in UI immediately
            await updateSession();
            
            toast.success("Business settings saved");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleModule = (key: string) => {
        setModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isFeatureAllowed = (key: string) => {
        if (user?.role === "super_admin") return true;
        return user?.featureFlags?.includes(key);
    };

    return (
        <div className="space-y-8 animate-fade-up">
            <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-2xl border-t-0 relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent max-w-2xl">
                <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                            BUSINESS <span className="text-primary">SETTINGS</span>
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                            Financial configuration and membership rules
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Tax Percentage (%)"
                            validateType="number"
                            value={data.taxPercentage.toString()}
                            onChange={val => setData({ ...data, taxPercentage: parseFloat(val) || 0 })}
                        />
                        <InputField
                            label="Joining Fee"
                            validateType="number"
                            value={data.joiningFee.toString()}
                            onChange={val => setData({ ...data, joiningFee: parseFloat(val) || 0 })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Auto-Expire Days"
                            validateType="number"
                            value={data.autoExpireDays.toString()}
                            onChange={val => setData({ ...data, autoExpireDays: parseInt(val) || 0 })}
                            description="Days before auto-archiving"
                        />
                        <InputField
                            label="Grace Period Days"
                            validateType="number"
                            value={data.gracePeriodDays.toString()}
                            onChange={val => setData({ ...data, gracePeriodDays: parseInt(val) || 0 })}
                            description="Days before suspension"
                        />
                    </div>
                </div>
            </Card>

            <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-2xl border-t-0 relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent max-w-2xl">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        MODULE <span className="text-primary">CONTROL</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Enable or disable specific features for your gym
                    </p>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { key: "attendance", label: "Attendance System", desc: "Member check-ins & logs" },
                            { key: "trainers", label: "Trainer Management", desc: "Schedules & sessions" },
                            { key: "workoutPlans", label: "Workout Plans", desc: "Digital templates" },
                            { key: "payments", label: "Payments Registry", desc: "Revenue tracking" },
                            { key: "auditLogs", label: "Security Logs", desc: "Admin activity tracking" },
                            { key: "multiBranch", label: "Multi-Branch Support", desc: "Manage other locations" },
                        ].map((m) => {
                            const allowed = isFeatureAllowed(m.key);
                            return (
                                <div 
                                    key={m.key} 
                                    className={cn(
                                        "p-4 rounded-xl border transition-all flex items-center justify-between gap-4",
                                        allowed ? "bg-white/[0.03] border-white/5" : "bg-black/20 border-white/[0.02] grayscale opacity-60"
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">{m.label}</span>
                                            {!allowed && <Lock className="w-3 h-3 text-amber-500/50" />}
                                        </div>
                                        <p className="text-[9px] text-slate-500 uppercase italic truncate">{m.desc}</p>
                                    </div>
                                    <Switch 
                                        checked={modules[m.key] ?? true} 
                                        onCheckedChange={() => toggleModule(m.key)}
                                        disabled={!allowed}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            <div className="max-w-2xl flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    <Settings2 className="w-3 h-3" />
                    v2.0 DYNAMIC_CORE_ENGINE
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={saving || loading}
                    className="h-11 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs neon-glow flex items-center gap-2"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    SAVE ALL SETTINGS
                </Button>
            </div>
        </div>
    );
}
