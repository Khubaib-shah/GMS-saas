"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Save, 
    Loader2, 
    ShoppingBag, 
    Dumbbell, 
    UserCheck, 
    LayoutGrid,
    CheckCircle2,
    Circle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ModuleSettings() {
    const [modules, setModules] = useState({
        trainersEnabled: true,
        attendanceEnabled: true,
        sellingEnabled: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/settings/modules")
            .then(res => res.json())
            .then(res => {
                if (res.modules) setModules(res.modules);
            })
            .catch(() => toast.error("Failed to load modules"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/modules", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ modules }),
            });
            if (res.ok) {
                toast.success("Module settings updated. Please refresh to see changes.");
            } else {
                throw new Error("Failed to save");
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleModule = (key: keyof typeof modules) => {
        setModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (loading) return (
        <div className="flex justify-center p-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    );

    const featureList = [
        {
            key: "trainersEnabled" as const,
            name: "Trainer Management",
            desc: "Enable personal training profiles, schedules, and reports.",
            icon: <Dumbbell className="w-5 h-5" />
        },
        {
            key: "attendanceEnabled" as const,
            name: "Attendance Tracking",
            desc: "Track member check-ins and generate attendance reports.",
            icon: <UserCheck className="w-5 h-5" />
        },
        {
            key: "sellingEnabled" as const,
            name: "Selling (Commerce)",
            desc: "Sell products, track inventory, and use Headless APIs.",
            icon: <ShoppingBag className="w-5 h-5" />,
            isNew: true
        }
    ];

    return (
        <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-2xl max-w-2xl animate-fade-up">
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        FEATURE <span className="text-primary">MODULES</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Enable or disable platform functionalities
                    </p>
                </div>
                <LayoutGrid className="w-5 h-5 text-slate-700" />
            </div>

            <div className="p-6 space-y-4">
                {featureList.map((feature) => (
                    <div 
                        key={feature.key}
                        onClick={() => toggleModule(feature.key)}
                        className={cn(
                            "group p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center gap-6",
                            modules[feature.key] 
                                ? "bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.05)]" 
                                : "bg-white/[0.02] border-white/5 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                        )}
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                            modules[feature.key] ? "bg-primary text-black shadow-lg" : "bg-slate-900 text-slate-600"
                        )}>
                            {feature.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-black uppercase tracking-tighter">{feature.name}</h4>
                                {feature.isNew && (
                                    <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase tracking-[0.2em] px-2">NEW</Badge>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{feature.desc}</p>
                        </div>
                        <div className={cn(
                            "transition-all duration-500",
                            modules[feature.key] ? "text-primary" : "text-slate-800"
                        )}>
                            {modules[feature.key] ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                        </div>
                    </div>
                ))}

                <div className="pt-6 border-t border-white/5 flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={saving}
                        className="h-12 px-10 rounded-xl bg-primary text-black hover:bg-white font-black tracking-tighter transition-all uppercase text-xs shadow-lg flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        UPDATE FEATURES
                    </Button>
                </div>
            </div>
        </Card>
    );
}
