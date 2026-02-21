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
    Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExerciseForm } from "@/components/exercise-form";

interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
    equipment: string;
    difficulty: string;
    isPublicWithinGym: boolean;
}

export function ExerciseLibrary() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);

    const fetchExercises = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/exercises");
            const data = await res.json();
            setExercises(data);
        } catch (err) {
            console.error("Failed to load exercises", err);
        } finally {
            setLoading(false);
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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">EXERCISE MANAGEMENT</span>
                        <div className="h-px w-20 bg-primary/20"></div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-foreground leading-none">
                        EXERCISE <span className="text-primary/40">LIBRARY</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setFormOpen(true)}
                        className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
                    >
                        <Plus className="mr-2 w-5 h-5" />
                        Add Exercise
                    </Button>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search exercises by name or muscle group..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-12 h-14 bg-slate-950/20 border-white/5 focus:border-primary/50 text-sm font-bold rounded-2xl transition-all"
                    />
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl bg-slate-950/20 border-white/5 hover:border-primary/20 hover:bg-white/5 text-[11px] font-black italic uppercase tracking-widest gap-3">
                    <Filter className="w-4 h-4" />
                    Filters
                </Button>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((ex) => (
                        <Card key={ex.id} className="group relative overflow-hidden bg-slate-950/20 border-white/5 p-6 hover:border-primary/20 transition-all duration-500 hover:translate-y-[-4px]">
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
                                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-300">
                                            <DropdownMenuItem className="text-[11px] font-black italic uppercase tracking-widest focus:bg-primary focus:text-black">Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-[11px] font-black italic uppercase tracking-widest focus:bg-red-500 focus:text-white">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between text-[10px] font-black italic tracking-widest">
                                <span className="text-slate-500 uppercase flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    Difficulty: {ex.difficulty.toUpperCase()}
                                </span>
                                <Button variant="ghost" size="sm" className="h-8 px-4 rounded-lg bg-white/5 hover:bg-primary hover:text-black text-[9px] group/btn">
                                    View Details
                                    <ChevronRight className="ml-2 w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
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
            />
        </div>
    );
}
