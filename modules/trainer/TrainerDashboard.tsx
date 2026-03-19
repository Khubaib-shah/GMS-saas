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
    Terminal,
    RefreshCw,
    Search,
    UserCircle,
    Mail,
    Phone
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TrainerStats {
    totalMembers: number;
    activePlans: number;
    membersWithoutPlans: number;
    todaySessions: number;
    complianceRate: number;
}

export function TrainerDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<TrainerStats | null>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchTrainerData = async () => {
        try {
            const res = await fetch("/api/trainer/stats");
            const d = await res.json();
            if (res.ok) {
                setStats(d.stats);
                setMembers(d.members);
            } else {
                toast.error(d.message || "Failed to load dashboard");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainerData();
    }, []);

    const filteredMembers = members.filter(m => 
        m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone?.includes(searchTerm)
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">Syncing Trainer Node...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic leading-none">Trainer Profile</span>
                        <div className="h-px w-20 bg-primary/20"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                        Analytics <span className="text-primary/40">Dashboard</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => router.push("/trainer/deploy")}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Send className="mr-2 w-5 h-5" />
                        Assign Workout
                    </Button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Members", val: stats?.totalMembers || 0, icon: Users, color: "primary" },
                    { label: "Active Plans", val: stats?.activePlans || 0, icon: Activity, color: "blue" },
                    { label: "Pending Assignments", val: stats?.membersWithoutPlans || 0, icon: AlertCircle, color: "red", alert: (stats?.membersWithoutPlans || 0) > 0 },
                    { label: "Plan Compliance", val: `${stats?.complianceRate || 0}%`, icon: TrendingUp, color: "green" }
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
                {/* Assigned Members List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-slate-950/20 border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
                                <Users className="w-4 h-4 text-primary" />
                                Assigned <span className="text-primary/40">Members</span>
                            </h3>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-primary/40 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Member</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Plan Status</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                                                No members found matching your search.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMembers.map((m) => (
                                            <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => router.push(`/members/${m.id}`)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                            <UserCircle className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black uppercase italic tracking-tight">{m.fullName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Phone className="w-2.5 h-2.5 text-slate-600" />
                                                                <span className="text-[9px] text-slate-500 font-bold tracking-widest">{m.phone || "No Phone"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            m.workoutPlanName !== "No Plan" ? "bg-primary" : "bg-red-500 animate-pulse"
                                                        )}></div>
                                                        <span className="text-[10px] font-black uppercase italic tracking-tight text-foreground">{m.workoutPlanName}</span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mt-1 tracking-widest">
                                                        Membership: <span className={m.subscriptionStatus === "active" ? "text-emerald-500" : "text-destructive"}>{m.subscriptionStatus}</span>
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-xs font-black italic">{m.attendanceStreak} Day Streak</span>
                                                        </div>
                                                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                                                            {m.lastCheckIn ? `Last seen ${formatDistanceToNow(new Date(m.lastCheckIn))} ago` : "Never checked in"}
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
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
                                <h3 className="text-sm font-black italic uppercase tracking-[0.2em] text-primary mb-2">Management Console</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    Manage workout plans and templates for your assigned roster.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={() => router.push("/trainer/exercises")}
                                    className="w-full h-14 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <Dumbbell className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        EXERCISE LIBRARY
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-all" />
                                </Button>

                                <Button
                                    onClick={() => router.push("/trainer/templates")}
                                    className="w-full h-14 bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all"
                                >
                                    <span className="flex items-center gap-3">
                                        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        CREATE TEMPLATE
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary transition-all" />
                                </Button>

                                <Button
                                    onClick={() => router.push("/trainer/deploy")}
                                    className="w-full h-14 bg-primary text-black hover:bg-white text-[11px] font-black italic uppercase tracking-[0.2em] justify-between px-6 rounded-2xl group transition-all shadow-lg"
                                >
                                    <span className="flex items-center gap-3">
                                        <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        QUICK ASSIGNMENT
                                    </span>
                                    <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-all" />
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-slate-950/20 border-white/5 p-6">
                        <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-4">Quick Alerts</h3>
                        <div className="space-y-4">
                            {(stats?.membersWithoutPlans || 0) > 0 && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10 grayscale hover:grayscale-0 transition-all cursor-pointer" onClick={() => setSearchTerm("")}>
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-red-500 tracking-wider">Action Required</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                                            {stats?.membersWithoutPlans} Members have no workout plans assigned.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 transition-all">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-primary tracking-wider">System Optimized</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                                        Trainer-Member node synchronization is complete.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
