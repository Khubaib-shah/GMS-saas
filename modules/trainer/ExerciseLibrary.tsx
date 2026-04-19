"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Plus,
    Filter,
    MoreVertical,
    Dumbbell,
    Layers,
    ChevronRight,
    Zap,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { DashboardHeader } from "@/components/dashboard-header";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExerciseForm, Exercise } from "@/components/exercise-form";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// Interface moved to @/components/exercise-form.tsx

export function ExerciseLibrary() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [mode, setMode] = useState<"add" | "edit" | "view">("add");
    const [deleting, setDeleting] = useState(false);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/exercises");
            const data = await res.json();
            // Map MongoDB _id to id if necessary
            const mappedData = data.map((ex: any) => ({
                ...ex,
                id: ex._id || ex.id
            }));
            setExercises(mappedData);
        } catch (err) {
            console.error("Failed to load exercises", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (exercise: Exercise, action: "edit" | "view" | "delete") => {
        setSelectedExercise(exercise);
        if (action === "delete") {
            setDeleteConfirmOpen(true);
        } else {
            setMode(action);
            setFormOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!selectedExercise?.id) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/exercises/${selectedExercise.id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Delete failed");
            toast.success("Exercise deleted");
            fetchExercises();
        } catch (err) {
            toast.error("Failed to delete exercise");
        } finally {
            setDeleting(false);
            setDeleteConfirmOpen(false);
            setSelectedExercise(null);
        }
    };

    useEffect(() => {
        fetchExercises();
    }, []);

    const filtered = exercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Header section */}
            <DashboardHeader
                title="EXERCISE"
                highlight="LIBRARY"
                subtitle="Exercise Management"
                description="Manage your custom exercises and standard library."
                descriptionIconColor="primary"
            >
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => {
                            setSelectedExercise(null);
                            setMode("add");
                            setFormOpen(true);
                        }}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add Exercise
                    </Button>
                </div>
            </DashboardHeader>

            <div className="flex flex-col md:flex-row gap-4">
                <InputField
                    hideLabel
                    validateType="text"
                    placeholder="Search exercises by name or muscle group..."
                    value={search}
                    onChange={(val) => setSearch(val)}
                    leadingIcon={<Search className="w-5 h-5" />}
                    className="h-[38px] glass-premium p-0 border-border bg-card dark:bg-slate-950/40 focus:border-primary/50 text-sm font-bold rounded-2xl transition-all"
                />
                <Button variant="outline" className="h-[38px] px-6 rounded-2xl glass-premium p-0 border-border bg-card dark:bg-slate-950/40 hover:border-primary/20 hover:bg-white/5 text-[11px] font-black italic uppercase tracking-widest gap-3">
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((ex) => (
                        <Card key={ex.id} className="group relative overflow-hidden glass-premium bg-card dark:bg-slate-950/40 border-border p-6 hover:border-primary/20 transition-all duration-500 hover:translate-y-[-4px]">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-10 -translate-y-10 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start justify-between relative">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black italic tracking-widest">{ex.muscleGroup.toUpperCase()}</Badge>
                                        {!ex.isPublicWithinGym && (
                                            <Badge variant="outline" className="bg-slate-800 text-slate-400 border-none text-[8px] font-black italic tracking-widest">PRIVATE</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter text-foreground group-hover:text-primary transition-colors uppercase truncate max-w-[200px]">
                                            {ex.name}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">{ex.equipment || "STANDARD_EQ"}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                        <Dumbbell className="w-5 h-5" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:text-white">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-card border-white/10 text-slate-300 backdrop-blur-xl">
                                            <DropdownMenuItem
                                                onClick={() => handleAction(ex, "edit")}
                                                className="text-[11px] font-black italic uppercase tracking-widest focus:bg-primary focus:text-black"
                                            >
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleAction(ex, "delete")}
                                                className="text-[11px] font-black italic uppercase tracking-widest focus:bg-destructive focus:text-destructive-foreground"
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-[10px] font-black italic tracking-widest">
                                <span className="text-slate-500 uppercase flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    Difficulty: {ex.difficulty.toUpperCase()}
                                </span>


                                <Button

                                    onClick={() => handleAction(ex, "view")}
                                    size="icon" asChild className="h-8 w-8  rounded-full bg-white/5 border border-white/10 text-primary group-hover:bg-primary group-hover:text-black transition-all duration-300 shadow-xl shadow-black/20">
                                    <ChevronRight className="w-4 h-4 hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 border border-dashed border-white/10 rounded-3xl">
                        <Layers className="w-12 h-12 text-slate-700" />
                        <p className="text-sm font-black italic text-slate-500 uppercase tracking-widest">No exercises match your search</p>
                        <Button variant="ghost" onClick={() => setSearch("")} className="text-primary text-[11px] font-black italic">Reset Filters</Button>
                    </div>
                )}
            </div>

            <ExerciseForm
                open={formOpen}
                onOpenChange={setFormOpen}
                onSuccess={fetchExercises}
                exercise={selectedExercise}
                mode={mode}
            />

            <ConfirmModal
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Delete"
                highlight="Exercise?"
                description="This action cannot be undone. This exercise will be removed from your gym's library."
                onConfirm={confirmDelete}
                loading={deleting}
                confirmText="Confirm Delete"
            />
        </div>
    );
}
