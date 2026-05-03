"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Mail, Server, ShieldCheck, User, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function EmailSettings() {
    const [data, setData] = useState({
        host: "",
        port: 587,
        secure: false,
        user: "",
        pass: "",
        fromName: "",
        fromEmail: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Cache key
    const CACHE_KEY = "gms_email_settings_cache";

    useEffect(() => {
        // 1. Try to load from cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                setData(JSON.parse(cached));
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached email settings", e);
            }
        }

        // 2. Fetch fresh data
        fetch("/api/settings/email")
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(res => {
                if (res.email) {
                    const freshData = {
                        host: res.email.host || "",
                        port: res.email.port || 587,
                        secure: res.email.secure || false,
                        user: res.email.user || "",
                        pass: res.email.pass || "",
                        fromName: res.email.fromName || "",
                        fromEmail: res.email.fromEmail || "",
                    };
                    setData(freshData);
                    localStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
                }
            })
            .catch(() => {
                if (!cached) toast.error("Failed to load email settings");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/email", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            // Update cache after save
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            toast.success("Email configuration saved");
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
                        EMAIL <span className="text-primary">CONFIGURATION</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        SMTP Gateway for automated communications
                    </p>
                </div>
                <div className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black italic uppercase tracking-widest border transition-all duration-500",
                    loading ? "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                )}>
                    {loading ? "Loading..." : "System Active"}
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* SMTP Server Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Server className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-white/50">Server Details</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <InputField
                                label="SMTP Host"
                                validateType="text"
                                value={data.host}
                                onChange={val => setData({ ...data, host: val })}
                                placeholder="smtp.gmail.com"
                                leadingIcon={<Server className="w-4 h-4" />}
                                className={cn(loading && !data.host && "text-transparent")}
                            />
                            {loading && !data.host && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                        <div className="relative">
                            <InputField
                                label="SMTP Port"
                                validateType="number"
                                value={data.port.toString()}
                                onChange={val => setData({ ...data, port: parseInt(val) || 587 })}
                                placeholder="587"
                                className={cn(loading && data.port === 587 && "text-transparent")}
                            />
                            {loading && data.port === 587 && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <div>
                                <Label className="text-[11px] font-black italic uppercase tracking-wider text-white">Secure Connection (SSL/TLS)</Label>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Use encrypted tunnel for emails</p>
                            </div>
                        </div>
                        {loading ? (
                            <Skeleton className="w-9 h-5 rounded-full bg-white/5" />
                        ) : (
                            <Switch 
                                checked={data.secure} 
                                onCheckedChange={v => setData({ ...data, secure: v })} 
                            />
                        )}
                    </div>
                </div>

                {/* Authentication */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-white/50">Authentication</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <InputField
                                label="Username / User"
                                validateType="text"
                                value={data.user}
                                onChange={val => setData({ ...data, user: val })}
                                placeholder="user@example.com"
                                leadingIcon={<User className="w-4 h-4" />}
                                className={cn(loading && !data.user && "text-transparent")}
                            />
                            {loading && !data.user && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                        <div className="relative">
                            <InputField
                                label="Password"
                                type="password"
                                validateType="password"
                                value={data.pass}
                                onChange={val => setData({ ...data, pass: val })}
                                placeholder="••••••••"
                                leadingIcon={<Lock className="w-4 h-4" />}
                                className={cn(loading && !data.pass && "text-transparent")}
                            />
                            {loading && !data.pass && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sender Info */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Send className="w-4 h-4 text-primary" />
                        <span className="text-[11px] font-black italic uppercase tracking-[0.2em] text-white/50">Sender Profile</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative">
                            <InputField
                                label="From Name"
                                validateType="text"
                                value={data.fromName}
                                onChange={val => setData({ ...data, fromName: val })}
                                placeholder="GymFlow Notifications"
                                className={cn(loading && !data.fromName && "text-transparent")}
                            />
                            {loading && !data.fromName && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                        <div className="relative">
                            <InputField
                                label="From Email"
                                validateType="email"
                                value={data.fromEmail}
                                onChange={val => setData({ ...data, fromEmail: val })}
                                placeholder="noreply@gym.com"
                                className={cn(loading && !data.fromEmail && "text-transparent")}
                            />
                            {loading && !data.fromEmail && (
                                <Skeleton className="absolute bottom-2.5 left-3 right-3 h-4 bg-white/5 rounded" />
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                        <Mail className="w-3 h-3" />
                        Custom SMTP enabled
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="h-11 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs rounded-lg neon-glow flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        SAVE CONFIGURATION
                    </Button>
                </div>
            </div>
        </Card>
    );
}
