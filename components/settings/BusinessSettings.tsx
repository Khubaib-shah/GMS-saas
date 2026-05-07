"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Save, Loader2, DollarSign, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BusinessSettings() {
    const [data, setData] = useState({
        joiningFee: 0,
        autoExpireDays: 0,
        gracePeriodDays: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cache key
    const CACHE_KEY = "gms_business_settings_cache";

    useEffect(() => {
        // 1. Try to load from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                setData(JSON.parse(cached));
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached business settings", e);
            }
        }

        // 2. Fetch fresh data
        fetch("/api/settings/business")
            .then(res => res.json())
            .then(res => {
                if (res.business) {
                    setData(res.business);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(res.business));
                }
            })
            .catch(() => toast.error("Failed to load business settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const payload = {
            joiningFee: data.joiningFee,
            autoExpireDays: data.autoExpireDays,
            gracePeriodDays: data.gracePeriodDays,
        };
        try {
            const res = await fetch("/api/settings/business", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            
            // Update cache after save
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            toast.success("Business settings saved");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-2xl border-t-0 relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent max-w-2xl animate-fade-up">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        BUSINESS <span className="text-primary">SETTINGS</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Financial configuration and membership rules
                    </p>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border transition-all duration-500",
                    loading ? "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                )}>
                    {loading ? "Loading..." : "Saved"}
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative">
                        <InputField
                            label="Joining Fee"
                            validateType="number"
                            min={0}
                            value={data.joiningFee.toString()}
                            onChange={val => setData({ ...data, joiningFee: parseFloat(val) || 0 })}
                            className={cn(loading && data.joiningFee === 0 && "text-transparent")}
                        />
                        {loading && data.joiningFee === 0 && (
                            <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                        )}
                    </div>
                    <div className="relative">
                        <InputField
                            label="Auto-Expire Days"
                            validateType="number"
                            min={0}
                            max={365}
                            value={data.autoExpireDays.toString()}
                            onChange={val => setData({ ...data, autoExpireDays: parseInt(val) || 0 })}
                            description="Days before auto-archiving"
                            className={cn(loading && data.autoExpireDays === 0 && "text-transparent")}
                        />
                        {loading && data.autoExpireDays === 0 && (
                            <Skeleton className="absolute bottom-5 left-3 right-3 h-4 bg-white/5 rounded" />
                        )}
                    </div>
                    <div className="relative">
                        <InputField
                            label="Grace Period Days"
                            validateType="number"
                            min={0}
                            max={90}
                            value={data.gracePeriodDays.toString()}
                            onChange={val => setData({ ...data, gracePeriodDays: parseInt(val) || 0 })}
                            description="Days before suspension"
                            className={cn(loading && data.gracePeriodDays === 0 && "text-transparent")}
                        />
                        {loading && data.gracePeriodDays === 0 && (
                            <Skeleton className="absolute bottom-5 left-3 right-3 h-4 bg-white/5 rounded" />
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        <Calculator className="w-3 h-3" />
                        Billing Engine v1.0
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || loading}
                        className="h-11 px-8 rounded-xl bg-primary text-black hover:bg-white font-black tracking-tighter transition-all uppercase text-xs rounded-lg neon-glow flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SAVE CHANGES
                    </Button>
                </div>
            </div>
        </Card>
    );
}
