"use client";

import { useState, useEffect } from "react";
import {
    Dumbbell,
    CheckCircle2,
    Clock,
    ChevronRight,
    Play,
    Info,
    Check,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Exercise {
    exerciseId: {
        _id: string;
        id: string;
        name: string;
        muscleGroup: string;
        svgUrl?: string;
    } | null;
    sets: number;
    reps: string;
    restSeconds: number;
    notes?: string;
}

interface ActiveWorkoutData {
    planId: string;
    templateName: string;
    currentDay: {
        dayNumber: number;
        title: string;
        exercises: Exercise[];
    };
}

export function ActiveWorkout() {
    const [data, setData] = useState<ActiveWorkoutData | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedExercises, setCompletedExercises] = useState<string[]>([]);
    const [logging, setLogging] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("memberToken");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        fetch("/api/member/active-workout", { headers })
            .then(res => res.json())
            .then(d => {
                if (d.planId) setData(d);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const toggleComplete = (exerciseId: string) => {
        setCompletedExercises(prev =>
            prev.includes(exerciseId) ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]
        );
    };

    const handleFinish = async () => {
        if (!data) return;
        setLogging(true);
        try {
            const token = localStorage.getItem("memberToken");
            const headers: any = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("/api/workout-log", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    planId: data.planId,
                    exercises: data.currentDay.exercises.filter(ex => ex.exerciseId).map(ex => ({
                        exerciseId: ex.exerciseId!._id || ex.exerciseId!.id,
                        setsCompleted: ex.sets,
                        repsCompleted: ex.reps
                    }))
                })
            });
            if (res.ok) {
                toast.success("Workout logged successfully!");
                setCompletedExercises([]);
            }
        } catch (err) {
            toast.error("Failed to log workout");
        } finally {
            setLogging(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">Retrieving Training Protocol...</p>
        </div>
    );

    if (!data) return (
        <Card className="bg-slate-950/20 border-white/5 p-12 text-center">
            <Dumbbell className="w-12 h-12 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">No Assigned Workout Plans</h3>
            <p className="text-[10px] text-slate-500 mt-2 font-black italic uppercase tracking-widest">Please contact your trainer to assign a workout protocol.</p>
        </Card>
    );

    const totalExercises = data.currentDay.exercises.length;
    const progress = totalExercises > 0 ? (completedExercises.length / totalExercises) * 100 : 100;

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            {/* Session Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black italic tracking-[0.2em] mb-2 uppercase">
                            Day {data.currentDay.dayNumber} Session
                        </Badge>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                            {data.currentDay.title}
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black italic text-slate-500 uppercase tracking-widest">Estimated Duration</span>
                        <div className="flex items-center gap-2 text-foreground font-black italic">
                            <Clock className="w-4 h-4 text-primary" />
                            45_MIN
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black italic uppercase tracking-widest text-slate-400">
                        <span>Training Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5 bg-white/5 shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]" />
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
                {totalExercises === 0 ? (
                    <Card className="bg-slate-950/20 border-white/5 border-dashed p-12 text-center text-slate-500">
                        <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-black italic uppercase tracking-widest text-slate-400">Rest Day</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest mt-2">No physical sessions scheduled for today.</p>
                    </Card>
                ) : (
                    data.currentDay.exercises.map((ex, idx) => {
                        if (!ex.exerciseId) return null; // Handle deleted exercises gracefully
                        const exId = ex.exerciseId._id || ex.exerciseId.id;
                        const isDone = completedExercises.includes(exId);

                        return (
                            <Card key={idx} className={cn(
                                "relative overflow-hidden transition-all duration-300",
                                isDone ? "bg-primary/5 border-primary/20" : "bg-slate-950/20 border-white/5"
                            )}>
                                <div className="p-5 flex items-center gap-4">
                                    <div
                                        onClick={() => toggleComplete(exId)}
                                        className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-2",
                                            isDone ? "bg-primary border-primary text-black" : "bg-white/5 border-white/5 text-slate-600 hover:border-primary/30"
                                        )}
                                    >
                                        {isDone ? <Check className="w-6 h-6 stroke-[3px]" /> : <Play className="w-5 h-5 ml-1" />}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className={cn(
                                            "text-lg font-black italic uppercase tracking-tight leading-none mb-1",
                                            isDone ? "text-primary transition-colors" : "text-foreground"
                                        )}>
                                            {ex.exerciseId.name}
                                        </h4>
                                        <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest">
                                            {ex.sets} SETS // {ex.reps} REPS // {ex.restSeconds}S REST
                                        </p>
                                    </div>

                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-700 hover:text-white">
                                        <Info className="w-5 h-5" />
                                    </Button>
                                </div>

                                {ex.notes && (
                                    <div className="px-5 pb-4 border-t border-white/5 pt-3">
                                        <p className="text-[10px] text-slate-500 font-medium italic italic">
                                            <span className="text-primary/50 font-black mr-2 uppercase tracking-widest">Technical Notes:</span>
                                            {ex.notes}
                                        </p>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Complete Button */}
            <Button
                disabled={logging || (totalExercises > 0 && completedExercises.length === 0)}
                onClick={handleFinish}
                className="w-full h-16 rounded-2xl bg-primary text-black hover:bg-white font-black italic text-xl tracking-tighter neon-glow transition-all active:scale-95 disabled:grayscale disabled:opacity-50"
            >
                {logging ? (
                    <>
                        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        Saving Progress...
                    </>
                ) : (
                    <>
                        Complete Workout
                        <CheckCircle2 className="ml-3 w-6 h-6" />
                    </>
                )}
            </Button>
        </div>
    );
}
