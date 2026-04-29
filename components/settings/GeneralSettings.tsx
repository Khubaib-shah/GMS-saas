"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Sparkles, Database } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function GeneralSettings() {
    const [data, setData] = useState({
        name: "",
        address: "",
        phone: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cache key
    const CACHE_KEY = "gms_general_settings_cache";

    useEffect(() => {
        // 1. Try to load from cache first for immediate hydration
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setData(parsed);
                // We still want to fetch fresh data, but we can set loading to false 
                // if we have cached data to show the form immediately.
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached settings", e);
            }
        }

        // 2. Fetch fresh data
        fetch("/api/settings/general")
            .then(res => res.json())
            .then(res => {
                if (res.general) {
                    setData(res.general);
                    // Update cache
                    localStorage.setItem(CACHE_KEY, JSON.stringify(res.general));
                }
            })
            .catch(() => toast.error("Failed to load general settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/general", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            
            // Update cache after successful save
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            toast.success("General settings saved");
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
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        GENERAL <span className="text-primary">SETTINGS</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Gym information and preferences
                    </p>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black italic uppercase tracking-widest border transition-all duration-500",
                    loading ? "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                )}>
                    {loading ? "Loading..." : "Saved"}
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                        <InputField
                            label="Gym Name"
                            validateType="text"
                            value={data.name}
                            onChange={val => setData({ ...data, name: val })}
                            placeholder="My Gym"
                            className={cn(loading && !data.name && "text-transparent")}
                        />
                        {loading && !data.name && (
                            <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                        )}
                    </div>
                    
                     <div className="relative">
                        <InputField
                            label="Phone Number"
                            validateType="phone"
                            value={data.phone}
                            onChange={val => setData({ ...data, phone: val })}
                            placeholder="+92 ..."
                            className={cn(loading && !data.phone && "text-transparent")}
                        />
                        {loading && !data.phone && (
                            <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1">
                    <div className="relative space-y-1">
                        <Label className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Address</Label>
                        <Textarea
                            value={data.address}
                            onChange={e => setData({ ...data, address: e.target.value })}
                            placeholder="Enter gym address..."
                            className={cn(
                                "min-h-[100px] bg-white/5 border-transparent focus:border-primary/50 focus:bg-white/10 text-[11px] font-bold tracking-wider transition-all duration-300 rounded-md resize-none",
                                loading && !data.address && "text-transparent"
                            )}
                        />
                        {loading && !data.address && (
                            <Skeleton className="absolute top-8 left-3 right-3 bottom-3 bg-white/5 rounded-md" />
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        <Database className="w-3 h-3" />
                        Last checked: {new Date().toLocaleTimeString()}
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || loading}
                        className="h-11 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs rounded-lg neon-glow flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SAVE SETTINGS
                    </Button>
                </div>
            </div>
        </Card>
    );
}
