"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Dumbbell,
    Plus,
    Trash2,
    Search,
    ChevronRight,
    Save,
    Clock,
    Zap,
    Layout,
    Calendar,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WorkoutBuilderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
}

const DAYS = [
    { id: "monday", label: "MON" },
    { id: "tuesday", label: "TUE" },
    { id: "wednesday", label: "WED" },
    { id: "thursday", label: "THU" },
    { id: "friday", label: "FRI" },
    { id: "saturday", label: "SAT" },
    { id: "sunday", label: "SUN" },
];

export function WorkoutPlanBuilder({ open, onOpenChange, initialData }: WorkoutBuilderProps) {
    const { exercises, loadExercises, addWorkoutPlan, updateWorkoutPlan } = useAppStore();
    useEffect(() => {
        if (open && exercises.length === 0) {
            loadExercises();
        }
    }, [open, exercises.length, loadExercises]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [activeTab, setActiveTab] = useState("monday");
    const [schedule, setSchedule] = useState<any[]>(
        DAYS.map(day => ({ day: day.id, title: `${day.label} Session Plan`, exercises: [] }))
    );
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open && initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");

            // Map saved schedule to UI format or initialize empty days
            const newSchedule = DAYS.map(day => {
                const savedDay = initialData.schedule?.find((s: any) => s.day === day.id);
                return {
                    day: day.id,
                    title: savedDay?.title || `${day.label} Session Plan`,
                    exercises: savedDay?.exercises || []
                };
            });
            setSchedule(newSchedule);
        } else if (open && !initialData) {
            // Reset if opening in create mode
            setName("");
            setDescription("");
            setSchedule(DAYS.map(day => ({ day: day.id, title: `${day.label} Session Plan`, exercises: [] })));
        }
    }, [open, initialData]);

    const filteredExercises = useMemo(() => {
        if (!exerciseSearch) return exercises.slice(0, 10);
        return exercises.filter(ex =>
            ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
            ex.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
        ).slice(0, 10);
    }, [exercises, exerciseSearch]);

    const handleAddExercise = (dayId: string, exercise: any) => {
        setSchedule(prev => prev.map(d => {
            if (d.day === dayId) {
                return {
                    ...d,
                    exercises: [...d.exercises, {
                        exerciseId: exercise._id || exercise.id,
                        name: exercise.name,
                        sets: 3,
                        reps: "12",
                        restSeconds: 60,
                        notes: ""
                    }]
                };
            }
            return d;
        }));
        toast.success(`${exercise.name} added to ${dayId.toUpperCase()}`);
    };

    const handleRemoveExercise = (dayId: string, index: number) => {
        setSchedule(prev => prev.map(d => {
            if (d.day === dayId) {
                const newExs = [...d.exercises];
                newExs.splice(index, 1);
                return { ...d, exercises: newExs };
            }
            return d;
        }));
    };

    const handleUpdateExercise = (dayId: string, index: number, data: any) => {
        setSchedule(prev => prev.map(d => {
            if (d.day === dayId) {
                const newExs = [...d.exercises];
                newExs[index] = { ...newExs[index], ...data };
                return { ...d, exercises: newExs };
            }
            return d;
        }));
    };

    const handleSave = async () => {
        if (!name) return toast.error("Plan name is required");

        // Filter out days with no exercises
        const finalSchedule = schedule.filter(d => d.exercises.length > 0);
        if (finalSchedule.length === 0) return toast.error("At least one exercise is required");

        setIsSaving(true);
        try {
            const planPayload = {
                name,
                description,
                schedule: finalSchedule.map(d => ({
                    day: d.day,
                    title: d.title || `${d.day.toUpperCase()} Session Plan`,
                    exercises: d.exercises.map((ex: any) => ({
                        exerciseId: ex.exerciseId,
                        sets: Number(ex.sets),
                        reps: String(ex.reps),
                        restSeconds: Number(ex.restSeconds),
                        notes: ex.notes
                    }))
                }))
            };

            if (initialData?._id || initialData?.id) {
                await updateWorkoutPlan(initialData._id || initialData.id, planPayload);
            } else {
                await addWorkoutPlan(planPayload);
            }

            onOpenChange(false);
            // Reset state
            setName("");
            setDescription("");
            setSchedule(DAYS.map(day => ({ day: day.id, title: `${day.label} Session Plan`, exercises: [] })));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[80vw] w-[80vw] flex flex-col p-0 bg-card border-none shadow-2xl overflow-y-auto">
                <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-slate-950/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-full bg-primary/5 -skew-x-12 translate-x-12 opacity-50" />
                    <div className="relative">
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">PLAN BUILDER ACTIVE</span>
                            <div className="h-px w-24 bg-primary/20"></div>
                        </div>
                        <DialogTitle className="text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none flex items-baseline gap-3">
                            WORKOUT <span className="text-primary/40">PLANNER</span>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                    {/* Left Panel: Plan Meta & Exercise Browser */}
                    <div className="w-full md:w-[380px] shrink-0 border-r border-white/5 bg-slate-950/10 p-8 space-y-10 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">PLAN NAME</label>
                                <Input
                                    placeholder="e.g., Strength Training (Core)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-white/5 border-transparent focus:border-primary/50 font-bold uppercase tracking-tighter italic h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">PLAN OBJECTIVE</label>
                                <Textarea
                                    placeholder="Describe the plan objective..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-white/5 border-transparent focus:border-primary/50 font-medium italic min-h-[80px] rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">EXERCISE LIBRARY</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="SEARCH EXERCISES..."
                                    value={exerciseSearch}
                                    onChange={(e) => setExerciseSearch(e.target.value)}
                                    className="pl-10 h-10 bg-white/5 border-transparent focus:border-primary/50 text-[10px] font-bold rounded-lg"
                                />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredExercises.map(ex => (
                                    <Card
                                        key={ex.id || ex._id}
                                        className="p-3 bg-white/[0.03] border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                                        onClick={() => handleAddExercise(activeTab, ex)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-[10px] font-black italic block truncate group-hover:text-primary transition-colors uppercase">{ex.name}</span>
                                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{ex.muscleGroup}</span>
                                            </div>
                                            <Plus className="w-3 h-3 text-slate-500 group-hover:text-primary transition-colors" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Schedule Builder */}
                    <div className="flex-1 min-w-0 flex flex-col bg-slate-950/5 relative overflow-y-auto custom-scrollbar">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-w-0">
                            <div className="p-4 bg-slate-950/20 border-b border-white/5">
                                <TabsList className="flex flex-wrap items-center gap-2 bg-transparent h-auto p-0">
                                    {DAYS.map(day => (
                                        <TabsTrigger
                                            key={day.id}
                                            value={day.id}
                                            className={cn(
                                                "h-10 px-6 rounded-xl text-[10px] font-black italic transition-all border border-white/10 shrink-0",
                                                "data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:border-primary",
                                                "data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:text-slate-500"
                                            )}
                                        >
                                            {day.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-scroll p-8">
                                {DAYS.map(day => (
                                    <TabsContent key={day.id} value={day.id} className="mt-0 space-y-6 focus-visible:outline-none">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black italic uppercase tracking-tighter text-foreground leading-none">{day.label}_PLAN</h4>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">EXERCISE SEQUENCE</span>
                                                </div>
                                            </div>
                                            <div className="px-4 py-1.5 rounded-full bg-slate-950/50 border border-white/5 text-[10px] font-black italic tracking-widest text-slate-400">
                                                {schedule.find(d => d.day === day.id)?.exercises.length || 0} EXERCISES
                                            </div>
                                        </div>

                                        <div className="space-y-4 overflow-y-auto">
                                            {schedule.find(d => d.day === day.id)?.exercises.map((ex: any, idx: number) => (
                                                <Card key={`${day.id}-${idx}`} className="p-4 bg-white/[0.02] border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>

                                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-xs font-black italic text-slate-500 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                                                                <h5 className="text-base font-black italic uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors">{ex.name}</h5>
                                                            </div>
                                                            <input
                                                                className="w-full bg-transparent border-none text-[10px] text-slate-500 focus:outline-none font-medium italic"
                                                                placeholder="Add training notes..."
                                                                value={ex.notes}
                                                                onChange={(e) => handleUpdateExercise(day.id, idx, { notes: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            <div className="space-y-1">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase block tracking-widest pl-1">SETS</span>
                                                                <Input
                                                                    type="number"
                                                                    className="w-16 h-10 bg-white/5 border-white/5 font-black text-center italic rounded-lg"
                                                                    value={ex.sets}
                                                                    onChange={(e) => handleUpdateExercise(day.id, idx, { sets: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase block tracking-widest pl-1">REPS</span>
                                                                <Input
                                                                    className="w-20 h-10 bg-white/5 border-white/5 font-black text-center italic rounded-lg uppercase"
                                                                    value={ex.reps}
                                                                    onChange={(e) => handleUpdateExercise(day.id, idx, { reps: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <span className="text-[8px] font-black text-slate-600 uppercase block tracking-widest pl-1">REST</span>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        className="w-20 h-10 bg-white/5 border-white/5 font-black text-center italic rounded-lg pr-7"
                                                                        value={ex.restSeconds}
                                                                        onChange={(e) => handleUpdateExercise(day.id, idx, { restSeconds: e.target.value })}
                                                                    />
                                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-600 uppercase italic">S</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-10 w-10 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                                onClick={() => handleRemoveExercise(day.id, idx)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}

                                            {(!schedule.find(d => d.day === day.id)?.exercises.length) && (
                                                <div className="py-20 flex flex-col items-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                                        <Dumbbell className="w-8 h-8 text-slate-700" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">NO EXERCISES ADDED</p>
                                                    <p className="text-[9px] text-slate-500 mt-2 font-medium italic">Use the left panel to assign exercises</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-950/60 border-t border-white/5">
                    <div className="w-full flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="flex items-center gap-5 px-6 py-4 rounded-2xl bg-white/5 border border-white/5 group">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Info className="w-5 h-5 font-black" />
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold italic leading-relaxed tracking-wide">
                                PLANS SYNC IN REAL-TIME. <br />
                                <span className="text-slate-200 uppercase font-black tracking-tighter">ENSURE PROPER REST.</span>
                            </p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto shrink-0">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none h-14 px-10 rounded-xl text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all bg-white/5 border border-white/5">
                                CANCEL
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 md:flex-none h-14 px-12 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                            >
                                {isSaving ? "SAVING..." : (initialData ? "UPDATE PLAN" : "SAVE PLAN")}
                                <Save className="ml-3 w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
