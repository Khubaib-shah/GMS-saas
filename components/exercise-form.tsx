"use client";

import { useState, useEffect } from "react";
import {
    Dumbbell,
    Save,
    X,
    Clipboard,
    Activity,
    Lock,
    Unlock,
    Info,
    Video,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
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
import { uploadToCloudinary } from "@/lib/upload-utils";
import { AssetPicker } from "@/components/gallery/asset-picker";

export interface Exercise {
    id?: string;
    _id?: string;
    name: string;
    muscleGroup: string;
    equipment?: string;
    difficulty: string;
    description?: string;
    svgUrl?: string;
    videoUrl?: string;
    isPublicWithinGym: boolean;
}

interface ExerciseFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    exercise?: Exercise | null;
    mode?: "add" | "edit" | "view";
}

const MUSCLE_GROUPS = [
    "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body"
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export function ExerciseForm({ open, onOpenChange, onSuccess, exercise, mode = "add" }: ExerciseFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Exercise>({
        name: "",
        muscleGroup: "",
        equipment: "",
        difficulty: "Beginner",
        description: "",
        svgUrl: "",
        videoUrl: "",
        isPublicWithinGym: true
    });
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    useEffect(() => {
        setSelectedAsset(null);
        if (exercise) {
            setFormData({
                id: exercise.id || exercise._id,
                name: exercise.name || "",
                muscleGroup: exercise.muscleGroup || "",
                equipment: exercise.equipment || "",
                difficulty: exercise.difficulty || "Beginner",
                description: exercise.description || "",
                svgUrl: exercise.svgUrl || "",
                videoUrl: exercise.videoUrl || "",
                isPublicWithinGym: exercise.isPublicWithinGym ?? true
            });
        } else {
            setFormData({
                name: "",
                muscleGroup: "",
                equipment: "",
                difficulty: "Beginner",
                description: "",
                svgUrl: "",
                videoUrl: "",
                isPublicWithinGym: true
            });
        }
    }, [exercise, open]);

    useEffect(() => {
        if (formData.videoUrl || formData.svgUrl) {
            console.log("Media state updated:", { video: formData.videoUrl, svg: formData.svgUrl });
        }
    }, [formData.videoUrl, formData.svgUrl]);

    const isViewMode = mode === "view";
    const isEditMode = mode === "edit";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.muscleGroup) {
            return toast.error("Name and Muscle Group are required");
        }

        setLoading(true);
        try {
            let finalFormData = { ...formData };

            // 1. Media
            if (selectedAsset) {
                finalFormData = {
                    ...finalFormData,
                    videoUrl: selectedAsset.type === "video" ? selectedAsset.url : "",
                    svgUrl: selectedAsset.type !== "video" ? selectedAsset.url : ""
                };
            }

            const url = isEditMode ? `/api/exercises/${finalFormData.id}` : "/api/exercises";
            const method = isEditMode ? "PUT" : "POST";

            toast.loading("Saving exercise...", { id: "ex-save" });
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalFormData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || `Failed to ${isEditMode ? "update" : "create"} exercise`);

            toast.success("Exercise saved successfully", { id: "ex-save" });
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast.error(err.message || "Failed to save exercise", { id: "ex-save" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] bg-background border-white/5 p-0 shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-white/2 relative shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-10 opacity-50" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Exercise Details</span>
                            <div className="h-px w-20 bg-primary/20"></div>
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter uppercase text-white leading-none">
                            {isViewMode ? "Exercise" : isEditMode ? "Edit" : "New"} <span className="text-primary">Exercise</span>
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Primary Info */}
                        <div className="space-y-4">
                            <InputField
                                label="Exercise Name"
                                validateType="text"
                                disabled={isViewMode}
                                placeholder="e.g., Barbell Bench Press"
                                value={formData.name}
                                onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
                                leadingIcon={<Clipboard className="w-3 h-3" />}
                                required
                                className="font-bold tracking-tight h-10 rounded-xl"
                            />

                            <div className="space-y-1.5 w-full">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-primary" />
                                    Target Muscle
                                </Label>
                                <Select
                                    disabled={isViewMode}
                                    value={formData.muscleGroup}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, muscleGroup: val }))}
                                >
                                    <SelectTrigger className="w-full bg-white/5 border-white/5 focus:border-primary/50 text-white font-bold h-10 rounded-xl">
                                        <SelectValue placeholder="Select Muscle Group" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10 text-white backdrop-blur-xl">
                                        {MUSCLE_GROUPS.map((group) => (
                                            <SelectItem key={group} value={group} className="font-bold text-[10px] focus:bg-primary focus:text-black">
                                                {group}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <InputField
                                label="Equipment Required"
                                validateType="text"
                                disabled={isViewMode}
                                placeholder="e.g., Barbell, Dumbbell"
                                value={formData.equipment}
                                onChange={(val) => setFormData(prev => ({ ...prev, equipment: val }))}
                                leadingIcon={<Dumbbell className="w-3 h-3" />}
                                className="font-bold h-10 rounded-xl"
                            />
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Difficulty Level
                                </Label>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {DIFFICULTIES.map((d) => (
                                        <Button
                                            key={d}
                                            type="button"
                                            variant="outline"
                                            onClick={() => !isViewMode && setFormData(prev => ({ ...prev, difficulty: d }))}
                                            className={cn(
                                                "h-10 rounded-xl border-white/5 text-[9px] font-black uppercase transition-all",
                                                formData.difficulty === d
                                                    ? "bg-primary text-primary border-primary neon-glow"
                                                    : "bg-white/5 text-white hover:bg-white/10"
                                            )}
                                        >
                                            {d}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Exercise Description</label>
                                <Textarea
                                    disabled={isViewMode}
                                    placeholder="Detailed instructions..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-medium min-h-[100px] rounded-xl text-xs py-3"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">Media Demonstrations</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            <AssetPicker 
                                onSelect={(asset) => setSelectedAsset(asset)}
                                trigger={
                                    <div className="group cursor-pointer">
                                        {(selectedAsset || formData.svgUrl || formData.videoUrl) ? (
                                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                                                {((selectedAsset?.type === "video") || (!selectedAsset && formData.videoUrl)) ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Video className="w-10 h-10 text-primary" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Video Demonstration</p>
                                                    </div>
                                                ) : (
                                                    <img src={selectedAsset?.url || formData.svgUrl} className="w-full h-full object-contain p-4" />
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                    <Button variant="ghost" className="text-white text-[10px] font-black uppercase tracking-widest">Change Media</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Demonstration Media</p>
                                            </div>
                                        )}
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                                formData.isPublicWithinGym ? "bg-primary/10 text-primary" : "bg-slate-800 text-slate-500"
                            )}>
                                {formData.isPublicWithinGym ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </div>
                            <div>
                                <p className="text-xs font-black tracking-tight text-white leading-none mb-1">
                                    {formData.isPublicWithinGym ? "Shared Access" : "Private"}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold tracking-widest leading-none">
                                    {formData.isPublicWithinGym ? "Available to all trainers" : "Only visible to your account"}
                                </p>
                            </div>
                        </div>
                        <Switch
                            disabled={isViewMode}
                            checked={formData.isPublicWithinGym}
                            onCheckedChange={(val) => setFormData(prev => ({ ...prev, isPublicWithinGym: val }))}
                            className="data-[state=checked]:bg-primary scale-90"
                        />
                    </div>
                </form>

                <DialogFooter className="p-6 pt-0 flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                        <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                        <p className="text-[9px] text-slate-500 font-bold leading-tight uppercase">
                            Accurate descriptions help members perform exercises safely.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-[34px] px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || isViewMode}
                            className={cn(
                                "h-[34px] px-8 rounded-xl font-black tracking-tighter shadow-lg transition-all min-w-[140px]",
                                isViewMode ? "hidden" : "bg-primary text-black hover:bg-white active:scale-95"
                            )}
                        >
                            {loading ? "Saving..." : isEditMode ? "Update" : "Save"}
                            <Save className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </DialogFooter>
           </DialogContent>
        </Dialog>
    );
}
