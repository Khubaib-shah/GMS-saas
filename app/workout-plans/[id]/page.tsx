"use client";

import { useEffect, useState, use } from "react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Clock,
    Flame,
    Dumbbell,
    Calendar,
    Target,
    Layers,
    Repeat,
    Activity,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WorkoutPlanDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { workoutPlans, loadWorkoutPlans, exercises, loadExercises } = useAppStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            if (workoutPlans.length === 0) await loadWorkoutPlans();
            if (exercises.length === 0) await loadExercises();
            setLoading(false);
        };
        init();
    }, []);

    const plan = workoutPlans.find((p: any) => p._id === id || p.id === id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-vh-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground animate-pulse font-black uppercase tracking-widest text-[10px]">Loading Plan...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-[400px] space-y-4">
                <Target className="w-16 h-16 text-slate-700" />
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Plan Not Found</h2>
                <Button onClick={() => router.back()} className="mt-4 bg-primary text-black font-black italic rounded-xl">Go Back</Button>
            </div>
        );
    }

    // Helper to get exercise details
    const getExerciseDetails = (exerciseId: string) => {
        return exercises.find((ex: any) => ex._id === exerciseId || ex.id === exerciseId);
    };

    return (
        <div className="space-y-10 animate-fade-up max-w-5xl mx-auto pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="h-12 px-4 rounded-xl hover:bg-white/5 group"
                >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-black italic uppercase tracking-widest text-[10px]">BACK_TO_PLANS</span>
                </Button>
            </div>

            {/* Plan Meta */}
            <Card className="p-8 relative overflow-hidden bg-slate-950/40 border-white/5 border-t-4 border-t-primary">
                <div className="absolute top-0 right-0 w-64 h-full bg-primary/5 -skew-x-12 translate-x-12 opacity-50" />
                <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[10px] font-black italic tracking-[0.2em] px-3 py-1">
                                {plan.schedule?.length || 0}_DAY_SPLIT
                            </Badge>
                            {!plan.isPublicWithinGym && (
                                <Badge variant="outline" className="bg-slate-800 text-slate-400 border-none text-[10px] font-black italic tracking-[0.2em] px-3 py-1">
                                    PRIVATE_PLAN
                                </Badge>
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase leading-tight">
                                {plan.name}
                            </h1>
                            <p className="text-slate-400 font-medium italic mt-2 max-w-2xl leading-relaxed">
                                {plan.description || "No specific objective defined for this training protocol."}
                            </p>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-4 shrink-0">
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FREQUENCY</p>
                                <p className="font-bold text-sm">{plan.schedule?.length || 0} Sessions / Week</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 min-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Flame className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">INTENSITY</p>
                                <p className="font-bold text-sm">Moderate/High</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Schedule / Routine */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                        <Layers className="w-4 h-4" />
                    </div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">TRAINING_SCHEDULE</h2>
                </div>

                <div className="space-y-8">
                    {plan.schedule?.map((day: any, idx: number) => (
                        <Card key={idx} className="overflow-hidden bg-slate-950/20 border-white/5 relative">
                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary/50" />

                            <div className="p-6 md:p-8 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground flex items-center gap-3">
                                            <span className="text-primary">{day.day.substring(0, 3)}</span>
                                            <span className="text-slate-300">-</span>
                                            {day.title || `${day.day} Session`}
                                        </h3>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black italic uppercase tracking-widest text-slate-400">
                                        {day.exercises.length} Exercises
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {day.exercises.length > 0 ? (
                                        day.exercises.map((ex: any, exIdx: number) => {
                                            const fullEx = getExerciseDetails(ex.exerciseId);
                                            return (
                                                <div key={exIdx} className="group flex flex-col md:flex-row gap-6 p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-transparent hover:border-white/10 transition-colors">

                                                    {/* Exercise Info */}
                                                    <div className="flex-1 flex gap-4">
                                                        <div className="w-12 h-12 rounded-xl border border-white/10 bg-slate-900 flex flex-col items-center justify-center shrink-0 shadow-inner">
                                                            <span className="text-[9px] font-black text-slate-500 italic uppercase">SEQ</span>
                                                            <span className="text-sm font-black text-foreground">{String(exIdx + 1).padStart(2, '0')}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-lg font-black italic uppercase text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                                                                {ex.name}
                                                            </h4>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">
                                                                {fullEx?.muscleGroup || "Compound"}
                                                            </span>
                                                            {ex.notes && (
                                                                <p className="text-xs text-slate-500 italic mt-2 flex items-start gap-2">
                                                                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                                                    {ex.notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Variables */}
                                                    <div className="flex items-center gap-3 shrink-0 flex-wrap md:flex-nowrap">
                                                        <div className="w-20 md:w-24 p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">SETS</span>
                                                            <div className="flex items-center justify-center gap-1.5 text-primary">
                                                                <Repeat className="w-4 h-4" />
                                                                <span className="text-xl font-black italic leading-none">{ex.sets}</span>
                                                            </div>
                                                        </div>

                                                        <div className="w-20 md:w-24 p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">REPS</span>
                                                            <div className="flex items-center justify-center gap-1.5 text-blue-400">
                                                                <Activity className="w-4 h-4" />
                                                                <span className="text-xl font-black italic leading-none uppercase">{ex.reps}</span>
                                                            </div>
                                                        </div>

                                                        <div className="w-20 md:w-24 p-3 rounded-xl bg-slate-950/50 border border-white/5 text-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-1">REST</span>
                                                            <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                                                                <Clock className="w-4 h-4" />
                                                                <span className="text-xl font-black italic leading-none">{ex.restSeconds}</span><span className="text-xs font-bold text-slate-400 mt-1">s</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                                            <Dumbbell className="w-8 h-8 text-slate-600 mb-3" />
                                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">REST_DAY</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}

                    {(!plan.schedule || plan.schedule.length === 0) && (
                        <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
                            <Calendar className="w-12 h-12 text-slate-600 mb-4" />
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest italic">NO_SCHEDULE_DEFINED</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
