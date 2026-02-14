"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_MAP: Record<string, number> = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

interface Availability {
  _id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
}

interface AvailabilityManagerProps {
  trainerId: string;
  availabilities: Availability[];
  onRefresh: () => void;
}

export function AvailabilityManager({ trainerId, availabilities, onRefresh }: AvailabilityManagerProps) {
  const [loading, setLoading] = useState(false);
  const [newAvail, setNewAvail] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 60,
  });

  const handleAdd = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trainers/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAvail, trainerId }),
      });
      if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to add availability");
      }
      toast.success("Availability added");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/trainers/availability/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete availability");
      toast.success("Availability removed");
      onRefresh();
    } catch (error) {
      toast.error("Error removing availability");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add Weekly Schedule
          </CardTitle>
          <CardDescription>Define recurring windows when you are available for sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <select
              className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={newAvail.dayOfWeek}
              onChange={(e) => setNewAvail({ ...newAvail, dayOfWeek: Number(e.target.value) })}
            >
              {DAYS.map((day) => (
                <option key={day} value={DAY_MAP[day]}>{day}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={newAvail.startTime} onChange={(e) => setNewAvail({ ...newAvail, startTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={newAvail.endTime} onChange={(e) => setNewAvail({ ...newAvail, endTime: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Slot Duration (minutes)</Label>
            <Input type="number" value={newAvail.slotDurationMinutes} onChange={(e) => setNewAvail({ ...newAvail, slotDurationMinutes: Number(e.target.value) })} />
          </div>
          <Button className="w-full" onClick={handleAdd} disabled={loading}>Add Entry</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Active Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availabilities.length > 0 ? (
                availabilities.map((avail) => (
                    <div key={avail._id} className="flex items-center justify-between p-3 border rounded-xl bg-muted/30">
                        <div>
                            <div className="font-bold">{avail.dayOfWeek === 0 ? "Sunday" : DAYS[avail.dayOfWeek - 1]}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {avail.startTime} - {avail.endTime} ({avail.slotDurationMinutes}m slots)
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(avail._id)}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))
            ) : (
                <div className="text-center py-8 text-muted-foreground italic">No availability set.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
