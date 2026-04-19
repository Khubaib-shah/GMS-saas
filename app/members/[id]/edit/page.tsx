"use client";

import type React from "react";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Upload, User, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { fileToBase64 } from "@/lib/utils/file-utils";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memberId } = use(params);
  const router = useRouter();
  const store = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  type Gender = "male" | "female" | "other" | undefined;
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: Gender;
    planId: string;
    notes: string;
    trainerId: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    planId: "plan_basic",
    notes: "",
    trainerId: "",
  });
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    store.loadMembers();
    store.loadPlans();
    fetchTrainers();

    const member = store.members.find((m) => m.id === memberId);
    if (member) {
      setFormData({
        firstName: member.firstName,
        lastName: member.lastName || "",
        email: member.email || "",
        phone: member.phone || "",
        gender: member.gender || ("male" as const),
        planId: member.planId || "plan_basic",
        notes: member.notes || "",
        trainerId: (typeof member.trainerId === 'object' && member.trainerId !== null)
          ? String((member.trainerId as any)._id || (member.trainerId as any).id || "")
          : String((member.trainerId as any) || ""),
      });
      if (member.photoBase64) {
        setPhotoPreview(member.photoBase64);
        setPhotoBase64(member.photoBase64);
      }
    }
  }, [memberId]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    } catch (error) {
      toast.error("Failed to read image");
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        // Filter only trainers
        setTrainers(data.filter((u: any) => u.role === 'trainer'));
      }
    } catch (error) {
      console.error("Failed to fetch trainers");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      await store.updateMember(memberId, {
        ...formData,
        photoBase64: photoBase64,
      });

      toast.success("Member updated successfully!");
      router.push(`/members/${memberId}`);
    } catch (error) {
      toast.error("Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* HUD HEADER */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-none">EDIT MEMBER DETAILS</span>
            <div className="h-px w-24 bg-black/5 dark:bg-white/5"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
            EDIT <span className="text-primary neon-text">MEMBER</span>
          </h1>
          <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            Editing Profile for Member ID: {memberId.toUpperCase().slice(-8)}
          </div>
        </div>
        <Link
          href={`/members/${memberId}`}
          className="h-12 px-6 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 uppercase tracking-widest transition-all italic"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="glass-premium p-8 border-border dark:bg-slate-950/40 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Member Information</h2>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                Profile Photo
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-white/5 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer overflow-hidden"
              >
                {photoPreview ? (
                  <div className="space-y-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10"
                      />
                      <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl pointer-events-none group-hover:border-primary/50 transition-all"></div>
                    </div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest italic animate-pulse">
                      Update Image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover:text-slate-300 transition-colors">
                      Upload New Photo
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="First Name"
                validateType="name"
                placeholder="John"
                value={formData.firstName}
                onChange={(val) =>
                  setFormData({ ...formData, firstName: val })
                }
                required
              />
              <InputField
                label="Last Name"
                validateType="name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(val) =>
                  setFormData({ ...formData, lastName: val })
                }
              />
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Email"
                validateType="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(val) =>
                  setFormData({ ...formData, email: val })
                }
              />
              <InputField
                label="Phone Number"
                validateType="phone"
                placeholder="+92 XXX XXXXXXX"
                value={formData.phone}
                onChange={(val) =>
                  setFormData({ ...formData, phone: val })
                }
              />
            </div>

            {/* Gender & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  Gender
                </Label>
                <Select
                  value={formData.gender || "male"}
                  onValueChange={(val) => setFormData({ ...formData, gender: val as any })}
                >
                  <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="male" className="text-[10px] font-bold uppercase tracking-widest">MALE</SelectItem>
                    <SelectItem value="female" className="text-[10px] font-bold uppercase tracking-widest">FEMALE</SelectItem>
                    <SelectItem value="other" className="text-[10px] font-bold uppercase tracking-widest">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  Membership Plan
                </Label>
                <Select
                  value={formData.planId}
                  onValueChange={(val) => setFormData({ ...formData, planId: val })}
                >
                  <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {store.plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id} className="text-[10px] font-bold uppercase tracking-widest">
                        {plan.name.toUpperCase()} - ₨ {plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                Assigned Trainer
              </Label>
              <Select
                value={formData.trainerId ? String(formData.trainerId) : "__none__"}

                onValueChange={(val) => setFormData({ ...formData, trainerId: val === "__none__" ? "" : val })}
              >
                <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                  <SelectValue placeholder="Select trainer" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="__none__" className="text-[10px] font-bold uppercase tracking-widest">NO TRAINER ASSIGNED</SelectItem>
                  {trainers.map((trainer) => {
                    const trainerValueId = String(trainer._id || trainer.id);
                    return (
                      <SelectItem key={trainerValueId} value={trainerValueId} className="text-[10px] font-bold uppercase tracking-widest">
                        {trainer.fullName?.toUpperCase() || trainer.firstName?.toUpperCase() || "UNKNOWN"}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                Additional Notes
              </Label>
              <textarea
                placeholder="Add any notes about the member..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full h-32 px-6 py-4 rounded-xl border-transparent bg-white/5 text-white font-bold text-[11px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-10">
              <Button
                type="submit"
                disabled={loading || !formData.firstName}
                className="flex-1 h-[38px] bg-primary text-black hover:bg-white font-black italic tracking-tighter text-lg rounded-xl transition-all uppercase neon-glow z-20"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: SUBJECT PREVIEW HUD */}
        <div className="space-y-8 sticky top-24">
          {/* Preview Card */}
          <div className="bento-item p-1 border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

            <div className="relative p-8 space-y-8 glass-premium border-border dark:bg-slate-950/80 rounded-[calc(1.5rem-4px)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1 block">Member Preview</span>
                  <h3 className="text-3xl font-black italic tracking-tighter text-foreground uppercase break-all">
                    {formData.firstName || "---"}_<span className="text-primary">{formData.lastName || "---"}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1 block">Security</span>
                  <div className="flex items-center gap-2 justify-end">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-black text-foreground italic tracking-widest uppercase">Encrypted</span>
                  </div>
                </div>
              </div>

              {/* Photo Preview HUD */}
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="absolute -inset-4 border border-primary/20 rounded-full animate-spin-slow"></div>
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl relative z-10 bg-slate-950 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover grayscale brightness-110" alt="HUD Preview" />
                    ) : (
                      <User className="w-20 h-20 text-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30 animate-scan pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-8 border-t border-black/10 dark:border-white/5 pt-8">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Contact Details</span>
                  <p className="text-xs font-bold text-foreground tracking-widest truncate">{formData.email || "---"}</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">{formData.phone || "---"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Membership Info</span>
                  <p className="text-xs font-bold text-foreground tracking-widest uppercase">{formData.gender || "---"}</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase">PLAN: {(formData.planId && store.plans.find(p => p.id === formData.planId)?.name) || "NO_PLAN"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}