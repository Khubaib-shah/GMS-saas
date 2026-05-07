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
import { InputField } from "@/components/ui/input-field";
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
            <DialogContent className="sm:max-w-[1100px] w-[95vw] h-[85vh] flex flex-col p-0 bg-card border-none shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-slate-950/20 relative shrink-0">
                    <div className="absolute top-0 right-0 w-48 h-full bg-primary/5 -skew-x-12 translate-x-10 opacity-50" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Plan Builder</span>
                            <div className="h-px w-16 bg-primary/20"></div>
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter uppercase text-foreground leading-none flex items-baseline gap-2">
                            Workout <span className="text-primary">Planner</span>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
                    {/* Left Panel: Plan Meta & Exercise Browser */}
                    <div className="w-full md:w-[280px] shrink-0 border-r border-white/5 bg-slate-950/10 p-5 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <InputField
                                label="Plan Name"
                                validateType="text"
                                placeholder="e.g., Strength Training"
                                value={name}
                                onChange={(val) => setName(val)}
                                className="h-9 rounded-lg"
                            />
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Objective</label>
                                <Textarea
                                    placeholder="Plan objective..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-white/5 max-h-24 border-transparent focus:border-primary/50 font-medium min-h-[60px] rounded-lg text-xs py-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <InputField
                                label="Exercise Library"
                                validateType="text"
                                placeholder="Search..."
                                value={exerciseSearch}
                                onChange={(val) => setExerciseSearch(val)}
                                leadingIcon={<Search className="w-3.5 h-3.5" />}
                                className="h-9 bg-white/5 border-transparent focus:border-primary/50 text-[10px] font-bold rounded-lg"
                            />

                            <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                                {filteredExercises.map(ex => (
                                    <div
                                        key={ex.id || ex._id}
                                        className="p-2.5 rounded-lg bg-white/3 border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group flex items-center justify-between"
                                        onClick={() => handleAddExercise(activeTab, ex)}
                                    >
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-black block truncate group-hover:text-primary transition-colors">{ex.name}</span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">{ex.muscleGroup}</span>
                                        </div>
                                        <Plus className="w-3 h-3 text-slate-500 group-hover:text-primary transition-colors shrink-0 ml-2" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Schedule Builder */}
                    <div className="flex-1 min-w-0 flex flex-col bg-slate-950/5 relative overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-w-0">
                            <div className="px-4 py-3 bg-slate-950/20 border-b border-white/5 shrink-0">
                                <TabsList className="flex flex-wrap items-center gap-1.5 bg-transparent h-auto p-0">
                                    {DAYS.map(day => (
                                        <TabsTrigger
                                            key={day.id}
                                            value={day.id}
                                            className={cn(
                                                "h-8 px-4 rounded-lg text-[9px] font-black transition-all border border-white/10 shrink-0",
                                                "data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-lg data-[state=active]:border-primary",
                                                "data-[state=inactive]:hover:bg-white/5 data-[state=inactive]:text-slate-500"
                                            )}
                                        >
                                            {day.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                                {DAYS.map(day => (
                                    <TabsContent key={day.id} value={day.id} className="mt-0 space-y-4 focus-visible:outline-none">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black uppercase tracking-tighter text-foreground leading-none">{day.label} Session</h4>
                                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sequence Builder</span>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 rounded-full bg-slate-950/50 border border-white/5 text-[9px] font-black tracking-widest text-slate-400">
                                                {schedule.find(d => d.day === day.id)?.exercises.length || 0} Exercises
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {schedule.find(d => d.day === day.id)?.exercises.map((ex: any, idx: number) => (
                                                <Card key={`${day.id}-${idx}`} className="p-3 bg-white/2 border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>

                                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-[10px] font-black text-slate-500 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                                                                <h5 className="text-sm font-black uppercase tracking-tighter text-foreground group-hover:text-primary transition-colors truncate">{ex.name}</h5>
                                                            </div>
                                                            <input
                                                                className="w-full bg-transparent border-none text-[10px] text-slate-500 focus:outline-none font-medium"
                                                                placeholder="Notes..."
                                                                value={ex.notes}
                                                                onChange={(e) => handleUpdateExercise(day.id, idx, { notes: e.target.value })}
                                                            />
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <InputField
                                                                label="Sets"
                                                                validateType="number"
                                                                containerClassName="w-12"
                                                                className="h-8 bg-white/5 border-white/5 font-black text-center rounded-lg text-xs"
                                                                value={ex.sets.toString()}
                                                                onChange={(val) => handleUpdateExercise(day.id, idx, { sets: val })}
                                                            />
                                                            <InputField
                                                                label="Reps"
                                                                validateType="text"
                                                                containerClassName="w-16"
                                                                className="h-8 bg-white/5 border-white/5 font-black text-center rounded-lg text-xs"
                                                                value={ex.reps}
                                                                onChange={(val) => handleUpdateExercise(day.id, idx, { reps: val })}
                                                            />
                                                            <InputField
                                                                label="Rest"
                                                                validateType="number"
                                                                containerClassName="w-16    "
                                                                className="h-8 bg-white/5 border-white/5 font-black text-center rounded-lg text-xs"
                                                                value={ex.restSeconds.toString()}
                                                                onChange={(val) => handleUpdateExercise(day.id, idx, { restSeconds: val })}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0"
                                                                onClick={() => handleRemoveExercise(day.id, idx)}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}

                                            {(!schedule.find(d => d.day === day.id)?.exercises.length) && (
                                                <div className="py-12 flex flex-col items-center border border-dashed border-white/10 rounded-2xl bg-white/1">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                                                        <Dumbbell className="w-6 h-6 text-slate-700" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No exercises</p>
                                                    <p className="text-[9px] text-slate-500 mt-1 font-medium">Assign exercises from the left panel</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter className="p-5 py-4 bg-slate-950/60 border-t border-white/5 shrink-0">
                    <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 group">
                            <Info className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-[10px] text-slate-400 font-bold leading-tight">
                                Plans sync in real-time. Ensure proper rest between sets.
                            </p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto shrink-0">
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 md:flex-none h-9 px-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all bg-white/5">
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 md:flex-none h-9 px-10 rounded-lg bg-primary text-black hover:bg-white font-medium md:font-black tracking-tighter shadow-lg transition-all active:scale-95"
                            >
                                {isSaving ? "Saving..." : (initialData ? "Update" : "Save")}
                                <Save className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
 Riverside           </DialogContent>
        </Dialog>
    );
}
