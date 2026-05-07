"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Check, ChevronsUpDown, X, User } from "lucide-react";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AttendanceResult } from "./attendance-result";

export function ManualEntry() {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);

  const [result, setResult] = useState<any>(null);

  // Filter only active members (basic check) if needed, or show all
  const members = store.members || [];

  const handleAttendance = async () => {
    if (!selectedMember) return;
    setLoading(true);
    setResult(null);
    try {
      const endpoint = isCheckout
        ? "/api/attendance/check-out"
        : "/api/attendance/check-in";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          gymId: store.gymProfile._id, // Ensure gymProfile is loaded
          date: new Date().toISOString().split('T')[0], // Anchor to current local date
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      setResult(data);
      toast.success(
        `Successfully ${isCheckout ? "Checked Out" : "Checked In"} ${data.member?.fullName || selectedMember.firstName
        }`
      );
      setSelectedMember(null);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-premium space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="text-sm  md:text-lg font-medium md:font-semibold">Manual Entry</h3>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="checkout-mode"
          checked={isCheckout}
          onCheckedChange={(checked) => setIsCheckout(checked as boolean)}
        />
        <Label htmlFor="checkout-mode" className="font-normal">Mark as Check-out</Label>
      </div>

      <div className="flex flex-col gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {selectedMember
                ? `${selectedMember.firstName} ${selectedMember.lastName || ""}`
                : "Select member..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-0"
            style={{ width: "var(--radix-popover-trigger-width)" }}
          >
            <Command className="glass-premium">
              <CommandInput
                placeholder="Search member name..."
                className="border-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              />
              <CommandList
                className="max-h-[200px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
                onWheel={(e) => e.stopPropagation()}
              >
                <CommandEmpty>No member found.</CommandEmpty>
                <CommandGroup>
                  {members.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.firstName} ${member.lastName}`}
                      onSelect={() => {
                        setSelectedMember(member);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer mb-1"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">
                        {member.firstName} {member.lastName}
                      </span>
                      <Check
                        className={`h-4 w-4 ${selectedMember?.id === member.id
                          ? "opacity-100"
                          : "opacity-0"
                          }`}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleAttendance}
          disabled={!selectedMember || loading}
          className="w-full"
        >
          {loading ? "Processing..." : isCheckout ? "Check Out" : "Check In"}
        </Button>
      </div>

      {result && (
        <div className="mt-6 border-t pt-6">
          <AttendanceResult
            data={result}
            isCheckout={isCheckout}
            onClose={() => setResult(null)}
          />
        </div>
      )}
    </div>
  );
}
