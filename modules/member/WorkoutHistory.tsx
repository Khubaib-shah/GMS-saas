"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    ChevronRight,
    Activity,
    Database,
    Search,
    Clock,
    CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputField } from "@/components/ui/input-field";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Log {
    _id: string;
    date: string;
    exercises: any[];
}

export function WorkoutHistory() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("memberToken");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        fetch("/api/workout-log", { headers })
            .then(res => res.json())
            .then(data => setLogs(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1">
                        WORKOUT <span className="text-primary/40">HISTORY</span>
                    </h2>
                    <p className="text-[10px] text-slate-500 font-black italic uppercase tracking-widest">Historical Workout Logs</p>
                </div>
            </div>

            {/* Search */}
            <InputField
                hideLabel
                validateType="text"
                placeholder="Search workout history..."
                value={search}
                onChange={(val) => setSearch(val)}
                leadingIcon={<Search className="w-4 h-4" />}
                className="h-12 bg-white/5 border-white/5 rounded-2xl font-black italic uppercase tracking-widest text-[10px]"
            />

            {/* Log List */}
            <div className="space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/2 animate-pulse" />)
                ) : logs.length > 0 ? (
                    logs.map((log) => (
                        <Card key={log._id} className="bg-slate-950/20 border-white/5 p-6 hover:bg-white/2 transition-colors group cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center justify-between relative">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5 group-hover:border-primary/30 transition-colors">
                                        <span className="text-[10px] font-black italic text-primary leading-none">
                                            {new Date(log.date).toLocaleDateString("en-US", { day: "2-digit" })}
                                        </span>
                                        <span className="text-[8px] font-black italic text-slate-500 uppercase">
                                            {new Date(log.date).toLocaleDateString("en-US", { month: "short" })}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black italic px-2">COMPLETED</Badge>
                                            <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest">
                                                {new Date(log.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black italic uppercase tracking-tight group-hover:text-primary transition-colors leading-none">
                                            {log.exercises.length} Exercises
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8">
                                    <div className="hidden md:block text-right">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">INTENSITY</p>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < 4 ? "bg-primary" : "bg-white/10")} />
                                            ))}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl space-y-4">
                        <Database className="w-12 h-12 text-slate-800" />
                        <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">No workout history found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
