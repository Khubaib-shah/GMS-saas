"use client";

import { useState, useEffect } from "react";
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

interface Log {
    id: string;
    memberId: string;
    date: string;
    exercises: any[];
}

export function ProgressTracking() {
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(false);

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
                    />

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                onClick={() => setSelectedMemberId(String(i))}
                                className={cn(
                                    "p-4 rounded-xl border transition-all cursor-pointer group flex items-center justify-between",
                                    selectedMemberId === String(i) ? "bg-primary/10 border-primary/30" : "bg-white/2 border-white/5 hover:bg-white/5"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black italic">
                                        RC
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black italic uppercase tracking-tight group-hover:text-primary transition-colors leading-none mb-1">Member {i}</p>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest underline decoration-primary/20">Status: Active</p>
                                    </div>
                                </div>
                                <Activity className={cn("w-3.5 h-3.5", selectedMemberId === String(i) ? "text-primary" : "text-slate-800")} />
                            </div>
                        ))}
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
                                <StatsCard title="Compliance Rate" value="92%" icon={<CheckCircle2 className="w-5 h-5 text-primary" />} />
                                <StatsCard title="Total Volume" value="42,800 KG" icon={<Activity className="w-5 h-5 text-primary" />} />
                                <StatsCard title="Training Consistency" value="4.5/WK" icon={<Clock className="w-5 h-5 text-primary" />} />
                            </div>

                            {/* Performance Chart Placeholder */}
                            <Card className="glass-premium border-border bg-card dark:bg-slate-950/40 p-8 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        Strength <span className="text-primary/40">Progression</span> Curve
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black italic">COMPOUND_LIFTS</Badge>
                                        <Badge className="bg-white/5 text-slate-500 border-none text-[8px] font-black italic">LAST_30_DAYS</Badge>
                                    </div>
                                </div>
                                <div className="h-64 flex items-end justify-between gap-4">
                                    {[60, 45, 80, 55, 95, 70, 85].map((h, i) => (
                                        <div key={i} className="flex-1 space-y-3 group/bar">
                                            <div className="w-full bg-white/5 rounded-t-xl relative overflow-hidden h-full">
                                                <div
                                                    className="absolute bottom-0 left-0 right-0 bg-primary/20 group-hover/bar:bg-primary transition-all duration-700"
                                                    style={{ height: `${h}%` }}
                                                />
                                            </div>
                                            <p className="text-center text-[8px] font-black italic text-slate-600">SEP_0{i + 1}</p>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Recent Logs List */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 pl-2">Training Logs</h3>
                                {[1, 2, 3].map(i => (
                                    <Card key={i} className="glass-premium border-border bg-card dark:bg-slate-950/40 p-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black italic text-primary uppercase tracking-widest">OCT_12_2023</span>
                                                    <span className="text-base font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">Push Day - Protocol A</span>
                                                </div>
                                                <div className="h-10 w-px bg-white/5" />
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">VOLUME</p>
                                                        <p className="text-xs font-bold italic">12,400 KG</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">DURATION</p>
                                                        <p className="text-xs font-bold italic">58 MIN</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700 group-hover:text-primary">
                                                <ChevronRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                                <Button className="w-full h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black italic uppercase tracking-[0.3em] text-slate-500 hover:text-white rounded-xl">
                                    Load Archive
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
