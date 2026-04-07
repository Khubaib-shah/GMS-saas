"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputField } from "@/components/ui/input-field";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: any;
  onSuccess: () => void;
}

export function BookingModal({ isOpen, onClose, slot, onSuccess }: BookingModalProps) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (search.length > 1) {
        const timer = setTimeout(searchMembers, 500);
        return () => clearTimeout(timer);
    } else {
        setMembers([]);
    }
  }, [search]);

  const searchMembers = async () => {
    setSearchLoading(true);
    try {
        const res = await fetch(`/api/members?search=${search}`);
        if (res.ok) {
            const data = await res.json();
            setMembers(data);
        }
    } finally {
        setSearchLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      const res = await fetch("/api/trainers/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot._id,
          memberId: selectedMember.id || selectedMember._id,
          notes
        }),
      });
      if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to book");
      }
      toast.success("Booking confirmed");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Session</DialogTitle>
          <DialogDescription>
            {format(new Date(slot.date), "EEEE, MMM d")} at {slot.startTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <InputField
              hideLabel
              validateType="text"
              placeholder="Name or email..."
              value={search}
              onChange={(val) => setSearch(val)}
              leadingIcon={<Search className="w-4 h-4" />}
            />
            {members.length > 0 && !selectedMember && (
                <div className="border rounded-lg max-h-40 overflow-auto bg-muted/20">
                    {members.map(m => (
                        <button
                            key={m.id || m._id}
                            className="w-full p-2 text-left hover:bg-primary/5 text-sm transition-colors border-b last:border-0"
                            onClick={() => {
                                setSelectedMember(m);
                                setSearch(`${m.firstName} ${m.lastName}`);
                            }}
                        >
                            {m.firstName} {m.lastName}
                        </button>
                    ))}
                </div>
            )}
          </div>

          {selectedMember && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                  <span className="font-medium text-sm text-primary">
                    {selectedMember.firstName} {selectedMember.lastName}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)} className="h-7 text-xs">Clear</Button>
              </div>
          )}

          <div className="space-y-2">
            <Label>Booking Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on lower body"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleBook} disabled={!selectedMember || loading}>
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
