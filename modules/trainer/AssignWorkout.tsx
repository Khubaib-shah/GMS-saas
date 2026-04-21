"use client";

import { useState, useEffect } from "react";
import {
    Users,
    Search,
    Check,
    Plus,
    Calendar,
    Layout,
    ChevronRight,
    Send,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { DashboardHeader } from "@/components/dashboard-header";
import Link from "next/link";

interface Member {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Template {
    id: string;
    name: string;
    daysPerWeek: number;
}

export function AssignWorkout() {
    const { workoutPlans, loadWorkoutPlans } = useAppStore();
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchMember, setSearchMember] = useState("");

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const memRes = await fetch("/api/members?search=");
                const mems = await memRes.json();
                setMembers(mems);
                if (workoutPlans.length === 0) {
                    await loadWorkoutPlans();
                }
            } catch (err) {
                toast.error("Failed to load assignment data");
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [loadWorkoutPlans, workoutPlans.length]);

    const filteredMembers = members.filter(m =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchMember.toLowerCase())
    );

    const toggleMember = (id: string) => {
        setSelectedMembers(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleAssign = async () => {
        if (!selectedTemplate || selectedMembers.length === 0) {
            return toast.error("Select at least one member and one template");
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/workout-assign", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    memberIds: selectedMembers,
                    startDate: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error("Assignment failed");

            const data = await res.json();
            toast.success(data.message);
            setSelectedMembers([]);
            setSelectedTemplate(null);
        } catch (err) {
            toast.error("Failed to assign plans");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Header section */}
            <DashboardHeader
                title="Plan"
                highlight="Assignment"
                subtitle="Assign Workout"
                description="Assign plans and templates to your members."
                descriptionIconColor="primary"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Step 1: Select Members */}
                <Card className="glass-premium border-border bg-card dark:bg-slate-950/40 p-8 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black italic uppercase tracking-widest leading-none mb-1">Select Members</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest underline decoration-primary/30">Step 01</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] font-black italic px-4 py-1">
                            {selectedMembers.length} Members Selected
                        </Badge>
                    </div>

                    <InputField
                        hideLabel
                        validateType="text"
                        placeholder="Search name or email..."
                        value={searchMember}
                        onChange={(val) => setSearchMember(val)}
                        leadingIcon={<Search className="w-4 h-4" />}
                        className="h-12 bg-white/5 border-white/5 rounded-xl font-bold tracking-tight text-xs"
                    />

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar overscroll-contain relative isolate">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-[38px] rounded-xl bg-white/2 animate-pulse" />)
                        ) : filteredMembers.length > 0 ? (
                            filteredMembers.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => toggleMember(m.id)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                        selectedMembers.includes(m.id)
                                            ? "bg-primary/10 border-primary/30"
                                            : "bg-white/2 border-white/5 hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            selectedMembers.includes(m.id) ? "bg-primary border-primary" : "border-slate-700"
                                        )}>
                                            {selectedMembers.includes(m.id) && <Check className="w-4 h-4 text-black font-black" />}
                                        </div>
                                        <div>
                                            <p className="font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors leading-none mb-1">
                                                {m.firstName} {m.lastName}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold tracking-widest">{m.email}</p>
                                        </div>
                                    </div>
                                    {selectedMembers.includes(m.id) && (
                                        <Badge variant="outline" className="bg-primary/20 text-primary border-none text-[8px] font-black italic">SELECTED</Badge>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-[10px] font-black italic text-slate-500 uppercase">No members found</div>
                        )}
                    </div>
                </Card>

                {/* Step 2: Select Template */}
                <div className="space-y-8">
                    <Card className="glass-premium border-border bg-card dark:bg-slate-950/40 p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Layout className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black italic uppercase tracking-widest leading-none mb-1">Select Template</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest underline decoration-primary/30">Step 02</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                [1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/2 animate-pulse" />)
                            ) : workoutPlans.length > 0 ? (
                                workoutPlans.map((t: any) => (
                                    <div
                                        key={t._id || t.id}
                                        onClick={() => setSelectedTemplate(t._id || t.id)}
                                        className={cn(
                                            "p-6 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between",
                                            selectedTemplate === (t._id || t.id)
                                                ? "bg-primary text-black border-primary shadow-lg"
                                                : "bg-white/2 border-white/5 hover:bg-white/5"
                                        )}
                                    >
                                        <div>
                                            <h4 className="font-black italic uppercase tracking-tighter text-lg leading-none mb-1">{t.name}</h4>
                                            <p className={cn(
                                                "text-[10px] font-bold uppercase tracking-[0.2em]",
                                                selectedTemplate === (t._id || t.id) ? "text-black/60" : "text-slate-500"
                                            )}>
                                                {t.schedule?.length || 0} Training Days
                                            </p>
                                        </div>
                                        <ChevronRight className={cn("w-5 h-5", selectedTemplate === (t._id || t.id) ? "text-black" : "text-slate-700")} />
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl space-y-4">
                                    <p className="text-[10px] font-black italic text-slate-500 uppercase tracking-widest leading-relaxed">
                                        No workout templates found for your gym.
                                    </p>
                                    <Button asChild className="h-10 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all group gap-2">
                                        <Link href="/workout-plans?create=true">
                                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                            Create Template
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Step 3: Deploy */}
                    <Card className="glass-premium border-border bg-card dark:bg-slate-950/40 p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                                <Send className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-black italic uppercase tracking-widest leading-none mb-1">Complete Assignment</h3>
                                <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                                    Assign the selected plan to the chosen members.
                                </p>
                            </div>
                        </div>

                        <Button
                            disabled={submitting || !selectedTemplate || selectedMembers.length === 0}
                            onClick={handleAssign}
                            className="w-full h-16 rounded-2xl bg-primary text-black hover:bg-white font-black italic text-lg tracking-tighter shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    Confirm Assignment
                                    <Check className="ml-3 w-6 h-6" />
                                </>
                            )}
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
