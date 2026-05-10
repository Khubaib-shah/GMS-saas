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
    Loader2,
    ChevronUp,
    ChevronDown,
    X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RestTimerDrawer } from "@/components/workout/rest-timer-drawer";

interface Exercise {
    exerciseId: {
        _id: string;
        id: string;
        name: string;
        muscleGroup: string;
        svgUrl?: string;
        videoUrl?: string;
        description?: string;
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
    const [completions, setCompletions] = useState<any[]>([]);
    const [logging, setLogging] = useState(false);
    const [timerOpen, setTimerOpen] = useState(false);
    const [activeTimerEx, setActiveTimerEx] = useState<any>(null);
    const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("memberToken");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Support manual day selection via URL params
        const params = new URLSearchParams(window.location.search);
        const day = params.get("day");
        const url = day ? `/api/member/active-workout?day=${day}` : "/api/member/active-workout";

        // Fetch workout plan AND today's completions in parallel
        Promise.all([
            fetch(url, { headers }).then(res => res.json()),
            fetch("/api/exercise-completion", { headers }).then(res => res.json()).catch(() => [])
        ]).then(([workoutData, completionsData]) => {
            if (workoutData.planId) setData(workoutData);
            setCompletions(completionsData);
            
            // Pre-mark exercises that were completed today
            if (Array.isArray(completionsData)) {
                const doneIds = completionsData
                    .filter((c: any) => c.status === "completed")
                    .map((c: any) => c.exerciseId?._id || c.exerciseId);
                if (doneIds.length > 0) {
                    const uniqueIds = Array.from(new Set(doneIds.map(id => id.toString()))) as string[];
                    setCompletedExercises(uniqueIds);
                }
            }
        }).catch(err => console.error(err))
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading Workout Plan...</p>
        </div>
    );

    if (!data) return (
        <Card className="bg-slate-950/20 border-white/5 p-12 text-center">
            <Dumbbell className="w-12 h-12 text-slate-800 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-400">No Assigned Workout Plans</h3>
            <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Please contact your trainer to assign a workout plan.</p>
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
                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-[0.2em] mb-2 uppercase">
                            Day {data.currentDay.dayNumber} Session
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">
                            {data.currentDay.title}
                        </h2>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estimated Duration</span>
                        <div className="flex items-center gap-2 text-foreground font-black">
                            <Clock className="w-4 h-4 text-primary" />
                            45_MIN
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
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
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-400">Rest Day</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest mt-2">No physical sessions scheduled for today.</p>
                    </Card>
                ) : (
                    data.currentDay.exercises.map((ex, idx) => {
                        if (!ex.exerciseId) return null; // Handle deleted exercises gracefully
                        const exId = ex.exerciseId._id || ex.exerciseId.id;
                        const isDone = completedExercises.includes(exId);
                        const isViewing = viewingExercise === ex;

                        return (
                            <Card key={idx} className={cn(
                                "relative overflow-hidden transition-all duration-300",
                                isDone ? "bg-primary/5 border-primary/20" : "bg-slate-950/20 border-white/5"
                            )}>
                                <div className="p-5 flex items-center gap-4">
                                    <div
                                        onClick={() => {
                                            const exCompletions = completions.filter(c => 
                                                (c.exerciseId?._id || c.exerciseId) === exId
                                            );
                                            const completedCount = exCompletions.filter(c => c.status === "completed").length;
                                            
                                            if (completedCount >= 2) {
                                                toast.error("Max attempts reached for today (2/2)");
                                                return;
                                            }

                                            setActiveTimerEx({ ...ex, planId: data.planId });
                                            setTimerOpen(true);
                                        }}
                                        className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-2",
                                            isDone 
                                                ? "bg-primary border-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" 
                                                : "bg-white/5 border-white/5 text-slate-600 hover:border-primary/30"
                                        )}
                                    >
                                        {isDone ? (
                                            <div className="flex flex-col items-center">
                                                <Check className="w-5 h-5 stroke-[3px]" />
                                                <span className="text-[6px] font-black uppercase mt-0.5">
                                                    {completions.filter(c => (c.exerciseId?._id || c.exerciseId) === exId && c.status === "completed").length}/2
                                                </span>
                                            </div>
                                        ) : <Play className="w-5 h-5 ml-1" />}
                                    </div>

                                    <div className="flex-1">
                                        <h4 className={cn(
                                            "text-lg font-black uppercase tracking-tight leading-none mb-1",
                                            isDone ? "text-primary transition-colors" : "text-foreground"
                                        )}>
                                            {ex.exerciseId.name}
                                        </h4>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {ex.sets} SETS // {ex.reps} REPS // {ex.restSeconds}S REST
                                        </p>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setViewingExercise(isViewing ? null : ex)}
                                        className={cn(
                                            "h-10 w-10 transition-all",
                                            isViewing ? "text-primary bg-primary/10" : "text-slate-700 hover:text-white"
                                        )}
                                    >
                                        {isViewing ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                                    </Button>
                                </div>

                                {/* Media & Details View */}
                                {isViewing && (
                                    <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            {/* Media Display */}
                                            {ex.exerciseId.svgUrl ? (
                                                <div className="relative w-full aspect-video bg-white/2 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 group">
                                                    <img
                                                        src={ex.exerciseId.svgUrl}
                                                        alt={ex.exerciseId.name}
                                                        className="max-w-[70%] max-h-[70%] object-contain drop-shadow-2xl"
                                                    />
                                                    <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1.5">
                                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-[7px] font-black text-primary uppercase tracking-wider">Illustration Demo</span>
                                                    </div>
                                                </div>
                                            ) : ex.exerciseId.videoUrl ? (
                                                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                                                    {ex.exerciseId.videoUrl.includes("youtube.com") || ex.exerciseId.videoUrl.includes("youtu.be") ? (
                                                        <iframe
                                                            className="w-full h-full"
                                                            src={ex.exerciseId.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                                            title="Exercise Demo"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    ) : (
                                                        <video
                                                            src={ex.exerciseId.videoUrl}
                                                            controls
                                                            className="w-full h-full object-contain"
                                                            autoPlay
                                                            muted
                                                            loop
                                                            playsInline
                                                        />
                                                    )}
                                                    <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1.5 z-10">
                                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                                        <span className="text-[7px] font-black text-primary uppercase tracking-wider">Video Demonstration</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full aspect-video bg-white/2 rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/5">
                                                    <Dumbbell className="w-10 h-10 text-slate-800 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Visual Demo Available</p>
                                                </div>
                                            )}

                                            {/* Instructions */}
                                            {ex.exerciseId.description && (
                                                <div className="space-y-2">
                                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Instructions:</h5>
                                                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                                                        {ex.exerciseId.description}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {ex.notes && !isViewing && (
                                    <div className="px-5 pb-4 border-t border-white/5 pt-3">
                                        <p className="text-[10px] text-slate-500 font-medium">
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
                onClick={handleFinish}
                disabled={logging || completedExercises.length === 0}
                className="w-full h-16 rounded-3xl bg-primary text-black hover:bg-white font-black tracking-tighter text-base shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] transition-all active:scale-95"
            >
                {logging ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        LOGGING SESSION...
                    </>
                ) : (
                    "FINISH WORKOUT SESSION"
                )}
            </Button>

            <RestTimerDrawer 
                open={timerOpen}
                onOpenChange={setTimerOpen}
                exercise={activeTimerEx}
                onComplete={async () => {
                    if (activeTimerEx?.exerciseId) {
                        const id = activeTimerEx.exerciseId._id || activeTimerEx.exerciseId.id;
                        
                        // Refresh completions
                        const token = localStorage.getItem("memberToken");
                        const headers: any = {};
                        if (token) headers["Authorization"] = `Bearer ${token}`;
                        
                        try {
                            const res = await fetch("/api/exercise-completion", { headers });
                            const completionsData = await res.json();
                            setCompletions(completionsData);
                            
                            const doneIds = completionsData
                                .filter((c: any) => c.status === "completed")
                                .map((c: any) => c.exerciseId?._id || c.exerciseId);
                            
                            const uniqueIds = Array.from(new Set(doneIds.map((id: any) => id.toString()))) as string[];
                            setCompletedExercises(uniqueIds);
                            
                            toast.success("Exercise completion saved!");
                        } catch (err) {
                            console.error(err);
                        }
                    }
                }}
            />
        </div>
    );
}
