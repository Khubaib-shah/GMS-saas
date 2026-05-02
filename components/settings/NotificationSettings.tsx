"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Bell, Shield, Zap } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
    const [data, setData] = useState({
        sendExpiryReminder: true,
        sendInvoiceEmail: false,
        sendSMS: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cache key
    const CACHE_KEY = "gms_notification_settings_cache";

    useEffect(() => {
        // 1. Try to load from cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                setData(JSON.parse(cached));
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached notification settings", e);
            }
        }

        // 2. Fetch fresh data
        fetch("/api/settings/notifications")
            .then(res => res.json())
            .then(res => {
                if (res.notifications) {
                    setData(res.notifications);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(res.notifications));
                }
            })
            .catch(() => toast.error("Failed to load notification settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const payload = {
            sendExpiryReminder: data.sendExpiryReminder,
            sendInvoiceEmail: data.sendInvoiceEmail,
            sendSMS: data.sendSMS,
        };
        try {
            const res = await fetch("/api/settings/notifications", {
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
            toast.success("Notification settings saved");
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
                        NOTIFICATION <span className="text-primary">SETTINGS</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Configure alerts and communications
                    </p>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black italic uppercase tracking-widest border transition-all duration-500",
                    loading ? "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                )}>
                    {loading ? "Loading..." : "Saved"}
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Expiry Reminders */}
                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                            <Bell className="w-4 h-4" />
                        </div>
                        <div>
                            <Label className="text-[11px] font-black italic uppercase tracking-wider text-white">Expiry Reminders</Label>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Auto-notify members before sub ends</p>
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="w-9 h-5 rounded-full bg-white/5" />
                    ) : (
                        <Switch 
                            checked={data.sendExpiryReminder} 
                            onCheckedChange={v => setData({ ...data, sendExpiryReminder: v })} 
                        />
                    )}
                </div>

                {/* Invoice Emails */}
                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div>
                            <Label className="text-[11px] font-black italic uppercase tracking-wider text-white">Invoice Emails</Label>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Digital receipts after every payment</p>
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="w-9 h-5 rounded-full bg-white/5" />
                    ) : (
                        <Switch 
                            checked={data.sendInvoiceEmail} 
                            onCheckedChange={v => setData({ ...data, sendInvoiceEmail: v })} 
                        />
                    )}
                </div>

                {/* SMS Notifications */}
                <div className="group flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Label className="text-[11px] font-black italic uppercase tracking-wider text-white">SMS Notifications</Label>
                                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-500/20 tracking-tighter">COMING SOON</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Critical alerts via SMS gateway</p>
                        </div>
                    </div>
                    {loading ? (
                        <Skeleton className="w-9 h-5 rounded-full bg-white/5" />
                    ) : (
                        <Switch 
                            checked={false} 
                            disabled={true}
                        />
                    )}
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        <Zap className="w-3 h-3 text-primary animate-pulse" />
                        Status: Ready
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving || loading}
                        className="h-11 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs rounded-lg neon-glow flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SAVE CHANGES
                    </Button>
                </div>
            </div>
        </Card>
    );
}
