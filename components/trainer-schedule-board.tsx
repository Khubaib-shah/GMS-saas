"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, startOfDay, parse } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Slot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "available" | "full" | "cancelled" | "blocked";
  bookedCount: number;
  capacity: number;
}

interface TrainerScheduleBoardProps {
  trainerId: string;
  canManage: boolean;
  onBookSlot?: (slot: Slot) => void;
}

export function TrainerScheduleBoard({ trainerId, canManage, onBookSlot }: TrainerScheduleBoardProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));

  const startDateStr = format(weekStart, "yyyy-MM-dd");

  useEffect(() => {
    fetchSlots();
  }, [startDateStr, trainerId]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const start = format(weekStart, "yyyy-MM-dd");
      // Fetch slots for the week
      const res = await fetch(`/api/trainers/slots?trainerId=${trainerId}&startDate=${start}`);
      if (!res.ok) throw new Error("Failed to fetch slots");
      const data = await res.json();
      setSlots(data);
    } catch (error) {
      toast.error("Error loading schedule");
    } finally {
      setLoading(false);
    }
  };

  const getSlotsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return slots.filter((s) => format(new Date(s.date), "yyyy-MM-dd") === formattedDay);
  };

  const statusColors = {
    available: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
    full: "bg-amber-100 text-amber-700 border-amber-200 cursor-not-allowed",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    blocked: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Weekly Schedule</h3>
            <span className="text-muted-foreground text-sm">
                ({format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")})
            </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {weekDays.map((day, idx) => {
          const daySlots = getSlotsForDay(day);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div key={idx} className={cn(
                "min-h-[200px] border rounded-xl overflow-hidden bg-card",
                isToday && "ring-2 ring-primary ring-inset"
            )}>
              <div className={cn(
                  "p-3 text-center border-b font-medium",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted/30"
              )}>
                <div className="text-xs uppercase opacity-70">{format(day, "EEE")}</div>
                <div className="text-lg">{format(day, "d")}</div>
              </div>

              <div className="p-2 space-y-2">
                {daySlots.length > 0 ? (
                  daySlots.map((slot) => (
                    <button
                      key={slot._id}
                      disabled={slot.status === "full" || slot.status === "blocked"}
                      onClick={() => onBookSlot?.(slot)}
                      className={cn(
                        "w-full p-2 rounded-lg border text-left transition-all text-xs space-y-1 group",
                        statusColors[slot.status]
                      )}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{slot.startTime}</span>
                        {slot.status === "available" && (
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-80">
                         <User className="w-3 h-3" />
                         <span>{slot.bookedCount} / {slot.capacity}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-[10px] text-muted-foreground italic">
                    No slots
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
