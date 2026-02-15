"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Upload, Users, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { fileToBase64 } from "@/lib/utils/file-utils";
import { toast } from "sonner";

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
    planId: "plan_basic",
    notes: "",
    trainerId: "",
  });
  const [trainers, setTrainers] = useState<any[]>([]);

  useEffect(() => {
    store.loadPlans();
    fetchTrainers();
  }, [store.members]);

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
      // Simulate slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newMember = await store.addMember({
        ...formData,
        photoBase64: photoBase64,
        joinDate: new Date().toISOString(),
      });

      // Create a subscription for the member
      const plan = store.plans.find((p) => p.id === formData.planId);
      if (plan && newMember) {
        await store.renewSubscription(newMember.id, formData.planId, plan.duration);
      }

      toast.success("Member added successfully!");
      router.push(`/members/${newMember.id}`);
    } catch (error) {
      toast.error("Failed to add member");
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
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">PROCESS: SUBJECT_INITIALIZATION_v1.0</span>
            <div className="h-px w-24 bg-black/5 dark:bg-white/5"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
            ADD <span className="text-primary neon-text">MEMBER</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
            Biometric and credential intake in progress.
          </p>
        </div>
        <Link
          href="/members"
          className="h-12 px-6 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 uppercase tracking-widest transition-all italic"
        >
          <ChevronLeft className="w-4 h-4" />
          ABORT_COMMAND
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* LEFT: INITIALIZATION FORM */}
        <div className="glass-premium p-8 border-border dark:bg-slate-950/40 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-black italic tracking-tighter text-foreground uppercase">INITIALIZATION_FORM</h2>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload - High Tech Dropzone */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                BIOMETRIC_VISUAL_DATA
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
                      UPDATE_VISUAL_RECORD
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic group-hover:text-slate-300 transition-colors">
                      DRAG_OR_SELECT_IMAGE_FILE
                    </p>
                  </div>
                )}
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary/20 top-0 animate-scan pointer-events-none opacity-0 group-hover:opacity-100"></div>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  IDENTIFIER: FIRST_NAME *
                </label>
                <Input
                  placeholder="EX: JOHN"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value.toUpperCase() })
                  }
                  required
                  className="h-12 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  IDENTIFIER: LAST_NAME
                </label>
                <Input
                  placeholder="EX: DOE"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value.toUpperCase() })
                  }
                  className="h-12 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  COMMS_ADDR: EMAIL
                </label>
                <Input
                  type="email"
                  placeholder="USER@SYSTEM.COM"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-12 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider transition-all duration-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  COMMS_ADDR: PHONE
                </label>
                <Input
                  type="tel"
                  placeholder="+92 XXX XXXXXXX"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-12 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider transition-all duration-300 rounded-xl"
                />
              </div>
            </div>

            {/* Gender & Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  BIOMETRIC: GENDER
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as "male" | "female" | "other",
                    })
                  }
                  className="h-12 w-full px-6 rounded-xl border-transparent bg-white/5 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="male" className="bg-slate-900">MALE_COORD</option>
                  <option value="female" className="bg-slate-900">FEMALE_COORD</option>
                  <option value="other" className="bg-slate-900">OTHER_COORD</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  DEPLOYMENT: PLAN *
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) =>
                    setFormData({ ...formData, planId: e.target.value })
                  }
                  className="h-12 w-full px-6 rounded-xl border-transparent bg-white/5 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  {store.plans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-slate-900">
                      {plan.name.toUpperCase()} - {plan.price}_PKR
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                  ASSIGNED_SUPERVISOR: TRAINER
                </label>
                <select
                  value={formData.trainerId}
                  onChange={(e) =>
                    setFormData({ ...formData, trainerId: e.target.value })
                  }
                  className="h-12 w-full px-6 rounded-xl border-transparent bg-white/5 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="" className="bg-slate-900">UNASSIGNED</option>
                  {trainers.map((trainer) => (
                    <option key={trainer._id || trainer.id} value={trainer._id || trainer.id} className="bg-slate-900">
                      {trainer.fullName.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
                METADATA_OBSERVATIONS
              </label>
              <textarea
                placeholder="INPUT ADDITIONAL SUBJECT DATA..."
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
                {loading ? "INITIALIZING..." : "COMMENCE_SUB_REGISTRY"}
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
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-1 block">SUBJECT_IDENT</span>
                  <h3 className="text-3xl font-black italic tracking-tighter text-foreground uppercase break-all">
                    {formData.firstName || "---"}_<span className="text-primary">{formData.lastName || "---"}</span>
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1 block">REG_STATUS</span>
                  <div className="flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-xs font-black text-foreground italic tracking-widest uppercase">PENDING_INIT</span>
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
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">SECURE_COMMS</span>
                  <p className="text-xs font-bold text-foreground tracking-widest truncate">{formData.email || "---"}</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1">{formData.phone || "---"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">BIOMETRIC_DATA</span>
                  <p className="text-xs font-bold text-foreground tracking-widest uppercase">{formData.gender || "---"}_ADDR</p>
                  <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase">PLAN: {store.plans.find(p => p.id === formData.planId)?.name || "---"}</p>
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
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">OPERATIONAL_NOTICE</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed mt-1">
                  Ensure all subject identifiers are accurately recorded. Misidentification may result in system-level access denial. Commencing operation will finalize biometric registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
