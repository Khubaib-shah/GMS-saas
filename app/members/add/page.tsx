"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Upload, Users, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { type Member } from "@/lib/types";
import { fileToBase64 } from "@/lib/utils/file-utils";
import { toast } from "sonner";
import { InputField } from "@/components/ui/input-field";

export default function AddMemberPage() {
  const router = useRouter();
  const store = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: "male" | "female" | "other";
    planId: string;
    notes: string;
    trainerId: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    planId: "",
    notes: "",
    trainerId: "",
  });
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    store.loadPlans();
    fetchTrainers();
  }, []);

  // Auto-set planId to first available plan when plans load
  useEffect(() => {
    if (store.plans.length > 0 && !formData.planId) {
      setFormData((prev) => ({ ...prev, planId: store.plans[0].id }));
    }
  }, [store.plans]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: Omit<Member, "id"> = {
        ...formData,
        photoBase64: photoBase64,
        joinDate: new Date().toISOString(),
      };
      // Clean up empty optional fields to prevent API errors
      if (!payload.trainerId) delete payload.trainerId;
      if (!payload.email) delete payload.email;
      if (!payload.phone) delete payload.phone;
      if (!payload.notes) delete payload.notes;
      console.log("[AddMember] Submitting payload:", { ...payload, photoBase64: payload.photoBase64 ? "[BASE64_IMAGE]" : null });

      const newMember = await store.addMember(payload);

      // Validate that we got a valid member ID back
      if (!newMember?.id) {
        throw new Error("Member created but no ID returned");
      }

      console.log("[AddMember] Member created with ID:", newMember.id);

      // Create a subscription for the member
      const plan = store.plans.find((p) => p.id === formData.planId);
      if (plan) {
        await store.renewSubscription(newMember.id, formData.planId, plan.duration);
      }

      toast.success("Member added successfully!");
      router.push(`/members/${newMember.id}`);
    } catch (error: any) {
      console.error("[AddMember] Error:", error);
      toast.error(error?.message || "Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-up">
      {/* HUD HEADER */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">MEMBER REGISTRATION</span>
            <div className="h-px w-24 bg-black/5 dark:bg-white/5"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
            ADD <span className="text-primary neon-text">MEMBER</span>
          </h1>
          <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            Please fill out the form below to add a new member.
          </div>
        </div>
        <Link
          href="/members"
          className="h-12 px-6 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 uppercase tracking-widest transition-all italic"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT: INITIALIZATION FORM */}
        <div className="glass-premium p-8 border-border dark:bg-slate-950/40 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-black italic tracking-tighter text-foreground uppercase">Member Details</h2>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload - High Tech Dropzone */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                Profile Photo
              </label>
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
                      Change Photo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover:text-slate-300 transition-colors">
                      Click or drag photo here
                    </p>
                  </div>
                )}
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary/20 top-0 animate-scan pointer-events-none opacity-0 group-hover:opacity-100"></div>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField
                label="First Name"
                validateType="name"
                placeholder="EX: JOHN"
                value={formData.firstName}
                onChange={(val) =>
                  setFormData({ ...formData, firstName: val.toUpperCase() })
                }
                required
              />
              <InputField
                label="Last Name"
                validateType="name"
                placeholder="EX: DOE"
                value={formData.lastName}
                onChange={(val) =>
                  setFormData({ ...formData, lastName: val.toUpperCase() })
                }
              />
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField
                label="Email Address"
                validateType="email"
                placeholder="user@example.com"
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
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  Gender
                </label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: value as "male" | "female" | "other",
                    })
                  }
                >
                  <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="male" className="text-[10px] font-bold uppercase tracking-widest">MALE</SelectItem>
                    <SelectItem value="female" className="text-[10px] font-bold uppercase tracking-widest">FEMALE</SelectItem>
                    <SelectItem value="other" className="text-[10px] font-bold uppercase tracking-widest">OTHER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  Membership Plan *
                </label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, planId: value })
                  }
                >
                  <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select plan" />
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

            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  Assign Trainer
                </label>
                <Select
                  value={formData.trainerId || "__none__"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trainerId: value === "__none__" ? "" : value })
                  }
                >
                  <SelectTrigger className="h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="__none__" className="text-[10px] font-bold uppercase tracking-widest">NO TRAINER ASSIGNED</SelectItem>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer._id || trainer.id} value={trainer._id || trainer.id} className="text-[10px] font-bold uppercase tracking-widest">
                        {trainer.fullName.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                Additional Notes
              </label>
              <textarea
                placeholder="Any special requirements or notes..."
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
                className="flex-1 h-14 bg-primary text-black hover:bg-white font-black italic tracking-tighter text-lg rounded-xl transition-all uppercase neon-glow z-20 group"
              >
                {loading ? "Saving..." : "Add Member"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: SUBJECT PREVIEW HUD */}
        <div className="space-y-8 sticky top-24">
          {/* Preview Card */}
          <div className="bento-item p-1 border-primary/20 relative overflow-hidden group">
            {/* Background HUD elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

            <div className="relative p-8 space-y-8 glass-premium border-border dark:bg-slate-950/80 rounded-[calc(1.5rem-4px)]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1 block">New Member</span>
                  <h3 className="text-3xl font-black italic tracking-tighter text-foreground uppercase break-all">
                    {formData.firstName || "---"}_<span className="text-primary">{formData.lastName || "---"}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1 block">Status</span>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-xs font-black text-foreground italic tracking-widest uppercase">Pending</span>
                  </div>
                </div>
              </div>

              {/* Photo Preview HUD */}
              <div className="flex justify-center py-8">
                <div className="relative">
                  <div className="absolute -inset-4 border border-primary/20 rounded-full animate-spin-slow"></div>
                  <div className="absolute -inset-8 border border-white/5 rounded-full animate-reverse-spin-slow opacity-50"></div>
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-slate-900 shadow-2xl relative z-10 bg-slate-950 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} className="w-full h-full object-cover grayscale brightness-110" alt="HUD Preview" />
                    ) : (
                      <Users className="w-20 h-20 text-slate-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30 animate-scan pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-8 border-t border-black/10 dark:border-white/5 pt-8">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Contact</span>
                  <p className="text-xs font-bold text-foreground tracking-widest truncate">{formData.email || "---"}</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">{formData.phone || "---"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Details</span>
                  <p className="text-xs font-bold text-foreground tracking-widest uppercase">{formData.gender || "---"}</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase">PLAN: {(formData.planId && store.plans.find(p => p.id === formData.planId)?.name) || (store.plans.length > 0 ? "SELECT A PLAN" : "LOADING...")}</p>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ENCRYPTION_LAYER</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">VERIFIED</span>
                </div>
                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Info Box */}
          <div className="bento-item p-6 bg-primary/5 border-primary/20 space-y-4">
            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-primary mt-1" />
              <div>
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Important Privacy Notice</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed mt-1">
                  Please ensure all member details are accurate before proceeding. Member information is stored securely according to privacy standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
