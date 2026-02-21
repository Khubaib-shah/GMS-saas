"use client";

import { useState } from "react";
import {
    Dumbbell,
    Save,
    X,
    Clipboard,
    Activity,
    Lock,
    Unlock,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ExerciseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const MUSCLE_GROUPS = [
    "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body"
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export function ExerciseForm({ open, onOpenChange, onSuccess }: ExerciseFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        muscleGroup: "",
        equipment: "",
        difficulty: "Beginner",
        description: "",
        isPublicWithinGym: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.muscleGroup) {
            return toast.error("Name and Muscle Group are required");
        }

        setLoading(true);
        try {
            const res = await fetch("/api/exercises", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error("Failed to create exercise");

            toast.success("Exercise saved successfully");
            onOpenChange(false);
            setFormData({
                name: "",
                muscleGroup: "",
                equipment: "",
                difficulty: "Beginner",
                description: "",
                isPublicWithinGym: true
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error("Failed to save exercise");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[80vw] w-[80vw] bg-slate-950 border-white/5 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-slate-900/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-10 opacity-50" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">EXERCISE CONFIGURATION</span>
                            <div className="h-px w-20 bg-primary/20"></div>
                        </div>
                        <DialogTitle className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
                            ADD <span className="text-primary/40">EXERCISE</span>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Primary Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                    <Clipboard className="w-3 h-3 text-primary" />
                                    Exercise Name
                                </Label>
                                <Input
                                    placeholder="e.g., Barbell Bench Press"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-bold uppercase tracking-tight h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-primary" />
                                    Target Muscle
                                </Label>
                                <Select
                                    value={formData.muscleGroup}
                                    onValueChange={(val) => setFormData({ ...formData, muscleGroup: val })}
                                >
                                    <SelectTrigger className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-bold uppercase h-12 rounded-xl">
                                        <SelectValue placeholder="Select Muscle Group" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                                        {MUSCLE_GROUPS.map((group) => (
                                            <SelectItem key={group} value={group} className="font-bold uppercase italic text-[10px] focus:bg-primary focus:text-black">
                                                {group.toUpperCase()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                    <Dumbbell className="w-3 h-3 text-primary" />
                                    Equipment Required
                                </Label>
                                <Input
                                    placeholder="e.g., Barbell, Dumbbell"
                                    value={formData.equipment}
                                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                                    className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-bold uppercase h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                                    Difficulty Level
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {DIFFICULTIES.map((d) => (
                                        <Button
                                            key={d}
                                            type="button"
                                            variant="outline"
                                            onClick={() => setFormData({ ...formData, difficulty: d })}
                                            className={cn(
                                                "h-12 rounded-xl border-white/5 text-[10px] font-black italic uppercase transition-all",
                                                formData.difficulty === d
                                                    ? "bg-primary text-black border-primary neon-glow"
                                                    : "bg-white/5 text-slate-500 hover:bg-white/10"
                                            )}
                                        >
                                            {d}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">Exercise Description</label>
                                <Textarea
                                    placeholder="Detailed instructions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-medium italic min-h-[120px] rounded-xl text-xs py-4"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                formData.isPublicWithinGym ? "bg-primary/10 text-primary" : "bg-slate-800 text-slate-500"
                            )}>
                                {formData.isPublicWithinGym ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className="text-xs font-black italic uppercase tracking-tight text-white leading-none mb-1">
                                    {formData.isPublicWithinGym ? "Shared Access" : "Private"}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                                    {formData.isPublicWithinGym ? "Available to all trainers in the gym" : "Only visible to your account"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={formData.isPublicWithinGym}
                            onCheckedChange={(val) => setFormData({ ...formData, isPublicWithinGym: val })}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>
                </form>

                <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[9px] text-slate-500 font-bold italic leading-tight uppercase">
                            Accurate descriptions help members perform exercises safely.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-14 px-8 rounded-xl text-[11px] font-black italic uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="h-14 px-10 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95 min-w-[160px]"
                        >
                            {loading ? "Saving..." : "Save Exercise"}
                            <Save className="ml-3 w-5 h-5" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
