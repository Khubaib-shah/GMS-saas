"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Activity,
    ClipboardList,
    Plus,
    Dumbbell,
    TrendingUp,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Send,
    Terminal
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TrainerStats {
    totalMembers: number;
    activePlans: number;
    membersWithoutPlans: number;
    todaySessions: number;
    complianceRate: number;
}

export function TrainerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<TrainerStats>({
        totalMembers: 42,
        activePlans: 38,
        membersWithoutPlans: 4,
        todaySessions: 12,
        complianceRate: 85
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">PROFESSIONAL_TRAINER_PROFILE</span>
                        <div className="h-px w-20 bg-primary/20"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                        PERFORMANCE <span className="text-primary/40">ANALYTICS</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.push("/trainer/deploy")}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Send className="mr-2 w-5 h-5" />
                        ASSIGN_WORKOUT
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "MANAGED_MEMBERS", val: stats.totalMembers, icon: Users, color: "primary" },
                    { label: "ACTIVE_PLANS", val: stats.activePlans, icon: Activity, color: "blue" },
                    { label: "PENDING_ASSIGNMENTS", val: stats.membersWithoutPlans, icon: AlertCircle, color: "red", alert: stats.membersWithoutPlans > 0 },
                    { label: "CLIENT_ADHERENCE", val: `${stats.complianceRate}%`, icon: TrendingUp, color: "green" }
                ].map((kpi, i) => (
                    <Card key={i} className="relative overflow-hidden group bg-slate-950/20 border-white/5 p-6 hover:border-primary/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -skew-x-12 translate-x-8 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">{kpi.label}</p>
                                <h3 className="text-3xl font-black italic tracking-tighter group-hover:text-primary transition-colors">{kpi.val}</h3>
                            </div>
                            <div className={cn(
                                "p-3 rounded-xl bg-white/5",
                                kpi.alert && "bg-red-500/10 text-red-500 animate-pulse"
                            )}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-950/20 border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-primary" />
                                ACTIVITY_SCHEDULE
                            </h3>
                            <Button variant="ghost" size="sm" className="text-[10px] font-black italic uppercase tracking-widest text-slate-500">FULL_HISTORY</Button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all cursor-pointer">
                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xs font-black italic">09:00</div>
                                    <div className="flex-1">
                                        <h4 className="font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">SARAH_CONNOR_PLAN</h4>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">STRENGTH_TRAINING // LEVEL_B</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar area */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 overflow-hidden relative selection:bg-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Terminal className="w-24 h-24" />
                        </div>
                        <div className="p-8 space-y-6 relative">
                            <div>
                                <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-primary mb-2">MANAGEMENT_CONSOLE</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    CORE PLAN ASSIGNMENT & TEMPLATE ARCHIVING.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push("/trainer/exercises")}
                                    className="w-full h-14 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <Dumbbell className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        EXERCISE_LIBRARY
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-all" />
                                </Button>

                                <Button
                                    onClick={() => router.push("/trainer/templates")}
                                    className="w-full h-14 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        CREATE_TEMPLATE
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-all" />
                                </Button>

                                <Button
                                    onClick={() => router.push("/trainer/deploy")}
                                    className="w-full h-14 bg-primary text-black hover:bg-white text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all shadow-lg"
                                >
                                    <span className="flex items-center gap-3">
                                        <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        QUICK_ASSIGNMENT
                                    </span>
                                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-all" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-slate-950/20 border-white/5 p-6">
                        <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-4">SYNC_STATUS</h3>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold italic mb-1 uppercase tracking-widest">
                                    <span>Sync_Status</span>
                                    <span className="text-primary">100%</span>
                                </div>
                                <Progress value={100} className="h-1 bg-white/5" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold italic mb-1 uppercase tracking-widest">
                                    <span>Database_Latency</span>
                                    <span className="text-blue-500">12ms</span>
                                </div>
                                <Progress value={12} className="h-1 bg-white/5" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
