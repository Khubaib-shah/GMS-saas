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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkoutPlanBuilder } from "@/components/workout-plan-builder";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export function WorkoutTemplates() {
    const { workoutPlans, loadWorkoutPlans, duplicateWorkoutPlan, deleteWorkoutPlan } = useAppStore();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            await loadWorkoutPlans();
            setLoading(false);
        };
        fetchTemplates();
    }, [loadWorkoutPlans]);

    const filtered = workoutPlans.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">TEMPLATE_REPOSITORY_ACTIVE</span>
                        <div className="h-px w-20 bg-primary/20"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                        WORKOUT <span className="text-primary">TEMPLATES</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setBuilderOpen(true)}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        CREATE_NEW_TEMPLATE
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <InputField
                    hideLabel
                    validateType="text"
                    placeholder="SEARCH_TEMPLATES..."
                    value={search}
                    onChange={(val) => setSearch(val)}
                    leadingIcon={<Search className="w-5 h-5" />}
                    className="h-14 bg-slate-950/20 border-white/5 focus:border-primary/50 text-sm font-bold rounded-2xl transition-all"
                />
            </div>

            {/* Templates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-44 rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((template) => (
                        <Card key={template._id || template.id} className="group relative overflow-hidden bg-slate-950/20 border-white/5 p-8 hover:border-primary/20 transition-all duration-500">
                            <div className="absolute top-0 right-0 w-48 h-full bg-primary/5 -skew-x-12 translate-x-12 opacity-50 group-hover:bg-primary/10 transition-colors" />

                            <div className="flex items-start justify-between relative">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[9px] font-black italic tracking-[0.2em]">{template.schedule?.length || 0}_DAY_PLAN</Badge>
                                        {!template.isPublicWithinGym && (
                                            <Badge variant="outline" className="bg-slate-800 text-slate-400 border-none text-[9px] font-black italic tracking-[0.2em]">PRIVATE</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase leading-none mb-1">
                                            {template.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] italic">{template.description || "GENERAL_WELLNESS"}</p>
                                    </div>

                                    <div className="flex items-center gap-6 pt-2">
                                        <div className="flex items-center gap-2 text-[10px] font-black italic text-slate-400">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            FREQUENCY: {template.schedule?.length || 0}X/WEEK
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
                                                EDIT_TEMPLATE
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => duplicateWorkoutPlan(template._id || template.id)}
                                                className="h-10 rounded-lg text-[11px] font-black italic uppercase tracking-widest focus:bg-primary focus:text-black gap-3 cursor-pointer"
                                            >
                                                <Copy className="w-4 h-4" />
                                                DUPLICATE_TEMPLATE
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => deleteWorkoutPlan(template._id || template.id)}
                                                className="h-10 rounded-lg text-[11px] font-black italic uppercase tracking-widest focus:bg-red-500 focus:text-white gap-3 cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                DELETE_TEMPLATE
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <Button size="icon" asChild className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 text-primary hover:bg-primary hover:text-black transition-all group/btn shadow-xl shadow-black/20">
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
                        <p className="text-sm font-black italic text-slate-500 uppercase tracking-widest">NO_TEMPLATES_FOUND</p>
                        <Button onClick={() => setBuilderOpen(true)} className="mt-4 bg-primary text-black font-black italic px-8 h-12 rounded-xl shadow-lg">CREATE_YOUR_FIRST_TEMPLATE</Button>
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
