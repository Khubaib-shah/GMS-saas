"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Save, AlertTriangle } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { toast } from "sonner";
import { format } from "date-fns";

interface SessionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

export function SessionLogModal({ isOpen, onClose, booking, onSuccess }: SessionLogModalProps) {
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([{ name: "", sets: 0, reps: 0, weight: "", notes: "" }]);
  const [trainerNotes, setTrainerNotes] = useState("");
  const [nextPlan, setNextPlan] = useState("");
  const [injuryFlags, setInjuryFlags] = useState(false);

  // Reset state when booking changes
  useEffect(() => {
    if (isOpen && booking) {
       // Ideally we fetch if a log already exists, but for now we create a new one
       setExercises([{ name: "", sets: 3, reps: 10, weight: "", notes: "" }]);
       setTrainerNotes("");
       setNextPlan("");
       setInjuryFlags(false);
    }
  }, [isOpen, booking]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10, weight: "", notes: "" }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: string, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleSubmit = async () => {
    if (!booking?._id) return;
    
    // Filter out empty exercises
    const validExercises = exercises.filter(e => e.name.trim() !== "");

    setLoading(true);
    try {
      const res = await fetch("/api/trainers/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking._id,
          exercises: validExercises,
          trainerNotes,
          nextPlan,
          injuryFlags,
        }),
      });

      if (!res.ok) throw new Error("Failed to save session log");
      
      toast.success("Session logged successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Session: {booking.memberId?.firstName} {booking.memberId?.lastName}
          </DialogTitle>
          <DialogDescription>
             Record the session details, exercises performed, and client progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          <div className="space-y-4 border rounded-xl p-4 bg-muted/10">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Exercises Performed</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleAddExercise} className="h-8">
                <Plus className="w-4 h-4 mr-1" /> Add Exercise
              </Button>
            </div>
            
            {exercises.map((ex, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3 p-3 bg-card border rounded-lg relative group">
                  <div className="w-full sm:w-[30%]">
                     <InputField 
                        label="Exercise" 
                        validateType="text" 
                        value={ex.name} 
                        onChange={(val) => handleExerciseChange(index, "name", val)} 
                     />
                  </div>
                  <div className="w-[20%] sm:flex-1">
                     <InputField 
                        label="Sets" 
                        validateType="number" 
                        value={String(ex.sets)} 
                        onChange={(val) => handleExerciseChange(index, "sets", Number(val))} 
                     />
                  </div>
                  <div className="w-[20%] sm:flex-1">
                     <InputField 
                        label="Reps" 
                        validateType="number" 
                        value={String(ex.reps)} 
                        onChange={(val) => handleExerciseChange(index, "reps", Number(val))} 
                     />
                  </div>
                  <div className="w-[40%] sm:flex-1">
                     <InputField 
                        label="Weight/Note" 
                        validateType="text" 
                        placeholder="e.g. 50 lbs"
                        value={ex.weight} 
                        onChange={(val) => handleExerciseChange(index, "weight", val)} 
                     />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveExercise(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Trainer Notes (Private)</Label>
            <Textarea 
              rows={3} 
              placeholder="How did the client perform? Any struggles?"
              value={trainerNotes}
              onChange={(e) => setTrainerNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Next Plan / Focus</Label>
            <Textarea 
              rows={2} 
              placeholder="What to focus on next session?"
              value={nextPlan}
              onChange={(e) => setNextPlan(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
               <p className="text-sm font-bold">Injury / Pain Reported?</p>
               <p className="text-xs opacity-80">Flag this session if the client reported pain or injury.</p>
            </div>
            <input 
               type="checkbox" 
               checked={injuryFlags}
               onChange={(e) => setInjuryFlags(e.target.checked)}
               className="w-5 h-5 accent-amber-500" 
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Save Session Log"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
