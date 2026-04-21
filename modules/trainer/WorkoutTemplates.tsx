"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    MoreVertical,
    Layout,
    Calendar,
    Clock,
    Zap,
    ChevronRight,
    Search,
    Copy,
    Trash2,
    Layers
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InputField } from "@/components/ui/input-field";
import { DashboardHeader } from "@/components/dashboard-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { WorkoutPlanBuilder } from "@/components/workout-plan-builder";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export function WorkoutTemplates() {
    const { workoutPlans, loadWorkoutPlans, duplicateWorkoutPlan, deleteWorkoutPlan } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [frequencyFilter, setFrequencyFilter] = useState("all");

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            await loadWorkoutPlans();
            setLoading(false);
        };
        fetchTemplates();
    }, [loadWorkoutPlans]);

    const filtered = workoutPlans.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase());
        const matchesFrequency = frequencyFilter === "all" || t.schedule?.length.toString() === frequencyFilter;
        return matchesSearch && matchesFrequency;
    });

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Header section */}
            <DashboardHeader
                title="WORKOUT"
                highlight="TEMPLATES"
                subtitle="Template Repository"
                description="Manage and create standard workout templates."
                descriptionIconColor="primary"
            >
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setBuilderOpen(true)}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Create New Template
                    </Button>
                </div>
            </DashboardHeader>

            {/* Search & Filter HUD */}
            <div className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-6 backdrop-blur-md">
                <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
                    <Filter className="w-3.5 h-3.5 text-primary/50" />
                    <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
                        FILTER
                    </span>
                </div>

                <div className="flex-1 w-full flex flex-col md:flex-row gap-2">
                    <InputField
                        hideLabel
                        validateType="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(val) => setSearch(val)}
                        leadingIcon={<Search className="w-4 h-4" />}
                        className="h-10 bg-transparent border-none hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase italic tracking-wider transition-all focus:border-none focus:ring-0"
                        containerClassName="flex-1"
                    />

                    <div className="h-6 w-px bg-white/5 hidden md:block self-center" />

                    <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                        <SelectTrigger className="h-10 w-full md:w-48 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
                            <span className="text-slate-500 mr-2">DAYS:</span>
                            <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
                            <SelectItem value="all" className="text-[10px] font-bold italic uppercase focus:bg-primary focus:text-black">All Frequencies</SelectItem>
                            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                                <SelectItem key={days} value={days.toString()} className="text-[10px] font-bold italic uppercase focus:bg-primary focus:text-black">
                                    {days} {days === 1 ? 'Day' : 'Days'} Per Week
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Templates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-44 rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((template) => (
                        <Card key={template._id || template.id} className="group relative overflow-hidden glass-premium bg-card dark:bg-slate-950/40 border-border p-8 hover:border-primary/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-48 h-full bg-primary/5 -skew-x-12 translate-x-12 opacity-50 group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-start justify-between relative">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[9px] font-black italic tracking-[0.2em]">{template.schedule?.length || 0} Day Plan</Badge>
                                        {!template.isPublicWithinGym && (
                                            <Badge variant="outline" className="bg-slate-800 text-slate-400 border-none text-[9px] font-black italic tracking-[0.2em]">Private</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase leading-none mb-1">
                                            {template.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] italic">{template.description || "General Wellness"}</p>
                                    </div>

                                    <div className="flex items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black italic text-slate-400">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            Frequency: {template.schedule?.length || 0}x/week
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black italic text-slate-400">
                                            <Layers className="w-3.5 h-3.5 text-primary" />
                                            INTENSITY: MODERATE
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-12">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 hover:text-white hover:bg-white/5 rounded-xl">
                                                <MoreVertical className="w-5 h-5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-300 w-48 p-2">
                                            <DropdownMenuItem
                                                onClick={() => {
                                                    setEditingPlan(template);
                                                    setBuilderOpen(true);
                                                }}
                                                className="h-10 rounded-lg text-[11px] font-black italic uppercase tracking-widest focus:bg-primary focus:text-black gap-3 cursor-pointer"
                                            >
                                                <Layout className="w-4 h-4" />
                                                Edit Template
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => duplicateWorkoutPlan(template._id || template.id)}
                                                className="h-10 rounded-lg text-[11px] font-black italic uppercase tracking-widest focus:bg-primary focus:text-black gap-3 cursor-pointer"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Duplicate Template
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => deleteWorkoutPlan(template._id || template.id)}
                                                className="h-10 rounded-lg text-[11px] font-black italic uppercase tracking-widest focus:bg-red-500 focus:text-white gap-3 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete Template
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button size="icon" asChild className="h-[38px] w-14 rounded-2xl bg-white/5 border border-white/10 text-primary hover:bg-primary hover:text-black transition-all group/btn shadow-xl shadow-black/20">
                                        <Link href={`/workout-plans/${template._id || template.id}`}>
                                            <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border border-dashed border-white/10 rounded-3xl">
                        <Layout className="w-12 h-12 text-slate-700" />
                        <p className="text-sm font-black italic text-slate-500 uppercase tracking-widest">No templates found</p>
                        <Button onClick={() => setBuilderOpen(true)} className="mt-4 bg-primary text-black font-black italic px-8 h-12 rounded-xl shadow-lg">Create your first template</Button>
                    </div>
                )}
            </div>

            <WorkoutPlanBuilder
                open={builderOpen}
                onOpenChange={(open) => {
                    setBuilderOpen(open);
                    if (!open) setEditingPlan(null);
                }}
                initialData={editingPlan}
            />
        </div>
    );
}
