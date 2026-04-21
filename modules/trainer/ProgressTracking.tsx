"use client";

import { useState, useEffect, useMemo } from "react";
import {
    LineChart,
    BarChart,
    Activity,
    TrendingUp,
    CheckCircle2,
    Clock,
    ChevronRight,
    Search,
    Filter
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InputField } from "@/components/ui/input-field";
import { Progress } from "@/components/ui/progress";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatsCard } from "@/components/stats-card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useSession } from "next-auth/react";
import { formatCurrency, formatDate } from "@/lib/utils/file-utils";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartSkeleton } from "@/components/ui/skeleton-components";

interface Log {
    id: string;
    memberId: string;
    date: string;
    exercises: any[];
}

export function ProgressTracking() {
    const store = useAppStore();
    const { data: session } = useSession();
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        store.loadMembers();
        store.loadWorkoutPlans();
        store.loadExercises();
    }, []);

    useEffect(() => {
        if (selectedMemberId) {
            setLoading(true);
            fetch(`/api/workout-log?memberId=${selectedMemberId}`)
                .then(res => res.json())
                .then(data => setLogs(data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [selectedMemberId]);

    const filteredMembers = store.members.filter(m => {
        const fullName = `${m.firstName} ${m.lastName || ""}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const selectedMember = store.members.find(m => m.id === selectedMemberId);

    const analytics = useMemo(() => {
        if (!logs || logs.length === 0) return { totalVolume: 0, compliance: 0, consistency: 0, chartData: [], statsCalculated: false };

        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);

        const recentLogs = logs.filter(l => new Date(l.date) >= monthAgo);

        // Total Volume (All time or last 30 days?) - Let's do all time for the "Total Volume" KPI
        let totalVolume = 0;
        logs.forEach(log => {
            log.exercises?.forEach((ex: any) => {
                const weight = ex.weightUsed || 0;
                const sets = ex.setsCompleted || 0;
                totalVolume += weight * sets;
            });
        });

        // Compliance
        let compliance = 0;
        if (selectedMember?.workoutPlanId) {
            const planTemplate = store.workoutPlans.find(p => p.id === selectedMember.workoutPlanId || p._id === selectedMember.workoutPlanId);
            if (planTemplate?.schedule) {
                const expectedPerWeek = planTemplate.schedule.length;
                const expectedTotal = expectedPerWeek * 4.3; // roughly a month
                compliance = Math.min(Math.round((recentLogs.length / expectedTotal) * 100), 100);
            }
        } else {
            // Default 3 sessions per week if no plan
            compliance = Math.min(Math.round((recentLogs.length / 12) * 100), 100);
        }

        // Consistency (Sessions per week last 30 days)
        const consistency = (recentLogs.length / 4.3).toFixed(1);

        // Chart Data (Grouped by date)
        const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const chartData = sortedLogs.slice(-10).map(log => {
            let sessionVolume = 0;
            log.exercises?.forEach((ex: any) => {
                sessionVolume += (ex.weightUsed || 0) * (ex.setsCompleted || 0);
            });
            return {
                date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                volume: sessionVolume
            };
        });

        return { totalVolume, compliance, consistency, chartData, statsCalculated: true };
    }, [logs, selectedMember, store.workoutPlans]);

    const chartConfig = {
        volume: {
            label: "Volume",
            color: "hsl(var(--primary))",
        },
    };

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Header section */}
            <DashboardHeader
                title="MEMBER"
                highlight="PERFORMANCE"
                subtitle="Analytics Overview"
                description="Track strength progression and monitor training compliance."
                descriptionIconColor="primary"
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Member Sidebar */}
                <Card className="lg:col-span-1 glass-premium border-border bg-card dark:bg-slate-950/40 p-6 h-fit space-y-6">
                    <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500">Active Members</h3>
                    <InputField
                        hideLabel
                        validateType="text"
                        placeholder="Search members..."
                        className="glass-premium p-0 bg-transparent border-border text-xs font-bold rounded-xl"
                        leadingIcon={<Search className="w-4 h-4" />}
                        value={searchTerm}
                        onChange={(val) => setSearchTerm(val)}
                    />

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredMembers.length > 0 ? filteredMembers.map(member => (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMemberId(member.id)}
                                className={cn(
                                    "p-4 rounded-xl border transition-all cursor-pointer group flex items-center justify-between",
                                    selectedMemberId === member.id ? "bg-primary/10 border-primary/30" : "bg-white/2 border-white/5 hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black italic">
                                        {member.firstName[0]}{member.lastName?.[0] || ""}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black italic uppercase tracking-tight group-hover:text-primary transition-colors leading-none mb-1">
                                            {member.firstName} {member.lastName}
                                        </p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest underline decoration-primary/20">Status: Active</p>
                                    </div>
                                </div>
                                <Activity className={cn("w-3.5 h-3.5", selectedMemberId === member.id ? "text-primary" : "text-slate-800")} />
                            </div>
                        )) : (
                            <p className="text-[10px] text-slate-500 font-bold uppercase italic text-center py-4">No members found</p>
                        )}
                    </div>
                </Card>

                {/* Main Analytics View */}
                <div className="lg:col-span-3 space-y-8">
                    {!selectedMemberId ? (
                        <div className="flex flex-col items-center justify-center h-[500px] border border-dashed border-white/10 rounded-3xl bg-white/1">
                            <TrendingUp className="w-16 h-16 text-slate-800 mb-6" />
                            <h3 className="text-lg font-black italic uppercase tracking-widest text-slate-500">Awaiting Member Selection</h3>
                            <p className="text-[10px] text-slate-600 mt-2 font-medium italic uppercase">Select a member from the list to view their training logs.</p>
                        </div>
                    ) : (
                        <>
                            {/* KPI Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatsCard title="Compliance Rate" value={`${analytics.compliance}%`} icon={<CheckCircle2 className="w-5 h-5 text-primary" />} isLoading={loading} />
                                <StatsCard title="Total Volume" value={`${analytics.totalVolume.toLocaleString()} KG`} icon={<Activity className="w-5 h-5 text-primary" />} isLoading={loading} />
                                <StatsCard title="Consistency" value={`${analytics.consistency}/WK`} icon={<Clock className="w-5 h-5 text-primary" />} isLoading={loading} />
                            </div>

                            {/* Performance Chart */}
                            <Card className="glass-premium border-border bg-card dark:bg-slate-950/40 p-8 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Strength <span className="text-primary/40">Progression</span> Curve
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black italic">Compound Volume</Badge>
                                        <Badge className="bg-white/5 text-slate-500 border-none text-[8px] font-black italic">Last 10 Sessions</Badge>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="h-64">
                                        <ChartSkeleton className="h-full border-none bg-transparent p-0" />
                                    </div>
                                ) : analytics.chartData.length > 0 ? (
                                    <ChartContainer config={chartConfig} className="h-64 w-full">
                                        <AreaChart data={analytics.chartData} margin={{ left: -20, right: 12, top: 12, bottom: 12 }}>
                                            <defs>
                                                <linearGradient id="fillVolume" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.4} />
                                                    <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#64748b' }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={8}
                                                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                                                style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#64748b' }}
                                            />
                                            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                                            <Area
                                                dataKey="volume"
                                                type="monotone"
                                                fill="url(#fillVolume)"
                                                fillOpacity={1}
                                                stroke="var(--color-volume)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl bg-black/5">
                                        <Activity className="w-8 h-8 text-slate-800 mb-2" />
                                        <p className="text-[10px] font-black text-slate-600 uppercase italic tracking-widest text-center">No workout data found for charting</p>
                                    </div>
                                )}
                            </Card>

                            {/* Recent Logs List */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 pl-2">Training Logs</h3>
                                {logs.length > 0 ? logs.map(log => {
                                    let sessionVolume = 0;
                                    log.exercises?.forEach((ex: any) => {
                                        sessionVolume += (ex.weightUsed || 0) * (ex.setsCompleted || 0);
                                    });
                                    const logDate = new Date(log.date);

                                    return (
                                        <Card key={log.id} className="glass-premium border-border bg-card dark:bg-slate-950/40 p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black italic text-primary uppercase tracking-widest">{formatDate(logDate).toUpperCase()}</span>
                                                        <span className="text-base font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">
                                                            {log.planId?.name || "Training Session"}
                                                        </span>
                                                    </div>
                                                    <div className="h-10 w-px bg-white/5" />
                                                    <div className="flex items-center gap-8">
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">VOLUME</p>
                                                            <p className="text-xs font-bold italic">{sessionVolume.toLocaleString()} KG</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">EXERCISES</p>
                                                            <p className="text-xs font-bold italic">{log.exercises?.length || 0} ITEMS</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700 group-hover:text-primary">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                }) : (
                                    <div className="p-12 text-center border border-dashed border-white/5 rounded-3xl bg-black/5">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">No session logs recorded yet</p>
                                    </div>
                                )}
                                {logs.length > 5 && (
                                    <Button className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500 hover:text-white rounded-xl">
                                        Load Archive
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
