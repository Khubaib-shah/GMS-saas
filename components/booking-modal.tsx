"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InputField } from "@/components/ui/input-field";
import { Search, UserPlus, Loader2 } from "lucide-react";
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
    if (isOpen) {
        searchMembers();
    } else {
        setMembers([]);
        setSearch("");
        setSelectedMember(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
        searchMembers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const searchMembers = async () => {
    setSearchLoading(true);
    try {
        const res = await fetch(`/api/members?search=${encodeURIComponent(search.trim())}`);
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
              placeholder="Search assigned members..."
              value={search}
              onChange={(val) => setSearch(val)}
              leadingIcon={<Search className="w-4 h-4" />}
            />
            {searchLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> Loading assigned members...
                </div>
            ) : members.length > 0 && !selectedMember && (
                <div className="border rounded-lg max-h-40 overflow-auto bg-muted/20">
                    {members.map(m => (
                        <button
                            key={m.id || m._id}
                            className="w-full p-2.5 text-left hover:bg-primary/5 text-sm transition-colors border-b last:border-0 flex items-center justify-between gap-2"
                            onClick={() => {
                                setSelectedMember(m);
                                setSearch(`${m.firstName} ${m.lastName}`);
                            }}
                        >
                            <span className="font-medium">{m.firstName} {m.lastName}</span>
                            {m.email && <span className="text-xs text-muted-foreground truncate max-w-[180px]">{m.email}</span>}
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
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)} className="h-7 text-xs hover:bg-primary/20">Clear</Button>
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
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
