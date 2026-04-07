"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import {
    Plus,
    Dumbbell,
    Edit,
    Trash2,
    Search,
    Calendar,
    Clock,
    ChevronRight,
    Zap,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { toast } from "sonner";
import Link from "next/link";
import { WorkoutPlanBuilder } from "@/components/workout-plan-builder";
import { DashboardHeader } from "@/components/dashboard-header";

export default function WorkoutPlansPage() {
    const { data: session } = useSession();
    const {
        workoutPlans,
        loadWorkoutPlans,
        exercises,
        loadExercises,
        deleteWorkoutPlan,
        gymProfile
    } = useAppStore();

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([
                loadWorkoutPlans(),
                loadExercises()
            ]);
            setLoading(false);
        };
        init();
    }, []);

    const filteredPlans = useMemo(() => {
        return workoutPlans.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [workoutPlans, searchQuery]);



    return (
        <div className="space-y-10 animate-fade-up">
            <DashboardHeader
                title="WORKOUT"
                highlight="PLANS"
                subtitle="MANAGEMENT: WORKOUT_PLANS"
                description="Create and manage training programs for your clients."
            >
                <Button className="h-14 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group gap-2" onClick={() => {
                    setEditingPlan(null);
                    setIsBuilderOpen(true);
                }}>
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    NEW PLAN
                </Button>
            </DashboardHeader>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <InputField
                    hideLabel
                    validateType="text"
                    placeholder="SEARCH PLANS..."
                    value={searchQuery}
                    onChange={(val) => setSearchQuery(val)}
                    leadingIcon={<Search className="w-5 h-5" />}
                    className="h-14 rounded-2xl bg-card border-none shadow-xl shadow-foreground/2 focus-visible:ring-primary"
                />
            </div>

            {/* Main Grid */}
            {filteredPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlans.map((plan) => (
                        <Card key={plan._id || plan.id} className="group relative overflow-hidden border-none shadow-xl shadow-foreground/3 bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <Dumbbell className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setEditingPlan(plan);
                                                setIsBuilderOpen(true);
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors z-10"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                deleteWorkoutPlan(plan._id || plan.id);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground leading-tight group-hover:text-primary transition-colors">
                                        {plan.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-2 italic font-medium">
                                        {plan.description || "No description provided for this plan."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Days</p>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            <span className="font-bold text-sm tracking-tighter">{plan.schedule?.length || 0} DAYS</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intensity</p>
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-amber-500" />
                                            <span className="font-bold text-sm tracking-tighter">HIGH</span>
                                        </div>
                                    </div>
                                </div>

                                <Button className="w-full h-12 rounded-xl bg-foreground/5 hover:bg-primary hover:text-primary-foreground border-none text-xs font-black uppercase tracking-widest transition-all italic group/btn" asChild>
                                    <Link href={`/workout-plans/${plan._id || plan.id}`}>
                                        VIEW PLAN DETAILS
                                        <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-16 flex flex-col items-center justify-center border-dashed border-2 bg-transparent text-center">
                    <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                        <Dumbbell className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground mb-2">No Plans Found</h3>
                    <p className="text-muted-foreground max-w-sm mb-8 italic">
                        You haven't created any workout plans yet. Start by creating a new plan for your clients.
                    </p>
                    <Button className="h-12 px-8 rounded-xl" onClick={() => setIsBuilderOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Initialize First Plan
                    </Button>
                </Card>
            )}

            {/* Info Card */}
            <Card className="p-6 bg-primary/5 border-primary/10 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-32 h-full bg-primary/10 -skew-x-12 translate-x-12" />
                <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-1">Trainer Notice</p>
                        <p className="text-sm text-foreground/80 italic font-medium">
                            Assigned plans are automatically synced to member dashboards. Use the <strong>Assign</strong> module to deploy specific plans to clients.
                        </p>
                    </div>
                </div>
            </Card>

            <WorkoutPlanBuilder
                open={isBuilderOpen}
                onOpenChange={(open) => {
                    setIsBuilderOpen(open);
                    if (!open) setEditingPlan(null);
                }}
                initialData={editingPlan}
            />
        </div>
    );
}
