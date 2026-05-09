"use client";

import type React from "react";

import { useState, useRef, useEffect, useMemo } from "react";
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
import { ChevronLeft, Upload, Users, AlertCircle, Loader2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { type Member } from "@/lib/types";
import { fileToBase64 } from "@/lib/utils/file-utils";
import { toast } from "sonner";
import { InputField } from "@/components/ui/input-field";
import { Field, FieldLabel } from "@/components/ui/field";

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

  const progress = useMemo(() => {
    const fields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.planId,
      formData.trainerId,
      photoBase64,
    ];
    const filled = fields.filter((f) => !!f).length;
    return (filled / fields.length) * 100;
  }, [formData, photoBase64]);

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
        setTrainers(data.filter((u: any) => u.role === "trainer"));
      }
    } catch (error) {
      console.error("Failed to fetch trainers");
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading("Processing photo...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "profiles/members");
      formData.append("resourceType", "image");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      
      if (data.url) {
        setPhotoBase64(data.url);
        setPhotoPreview(data.url);
        toast.success("Photo processed", { id: loadingToast });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error("Photo upload failed", { id: loadingToast });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email && !formData.phone) {
      toast.error("Either Email or Phone Number is required");
      setLoading(false);
      return;
    }

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
      console.log("[AddMember] Submitting payload:", {
        ...payload,
        photoBase64: payload.photoBase64 ? "[BASE64_IMAGE]" : null,
      });

      const newMember = await store.addMember(payload);

      // Validate that we got a valid member ID back
      if (!newMember?.id) {
        throw new Error("Member created but no ID returned");
      }

      console.log("[AddMember] Member created with ID:", newMember.id);

      // Create a subscription for the member
      const plan = store.plans.find((p) => p.id === formData.planId);
      if (plan) {
        await store.renewSubscription(
          newMember.id,
          formData.planId,
          plan.duration,
        );
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
    <div className="space-y-4 md:space-y-10 animate-fade-up">
      <div className="flex flex-col gap-4 md:flex-row items-center justify-between md:mb-8 relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-bold md:font-black text-slate-500 tracking-[0.4em] leading-none">
              NEW MEMBER REGISTRATION
            </span>
            <div className="h-px w-24 bg-black/5 dark:bg-white/5"></div>
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-foreground tracking-tighter uppercase leading-none">
            ADD <span className="text-primary neon-text">MEMBER</span>
          </h1>
          <div className="text-slate-500 font-bold md:font-bold uppercase tracking-widest text-[10px] md:mt-4 flex items-center gap-2">
            Please fill out the form below to add a new member.
          </div>
        </div>
        <Link
          href="/members"
          className="ml-auto md:ml-0 h-10 px-2 md:px-6 md:h-12 rounded-xl border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 flex items-center md:gap-3 text-[10px] font-normal md:font-black text-slate-400 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 uppercase tracking-widest transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Cancel
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-12 items-start">
        {/* LEFT: MEMBER DETAILS FORM */}
        <div className="glass-premium p-4 md:p-8 border-border dark:bg-slate-950/40 space-y-8">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">
              Member Details
            </h2>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Photo Upload */}
            <Field>
              <InputField
                label="Profile Photo"
                ref={fileInputRef}
                type="file"
                validateType="text"
                accept="image/*"
                hideLabel={true}
                onChange={(_, e) =>
                  e &&
                  handlePhotoChange(e as React.ChangeEvent<HTMLInputElement>)
                }
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
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">
                      Update Photo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-slate-500 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">
                      Click or drag to upload photo
                    </p>
                  </div>
                )}
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-primary/20 top-0 animate-scan pointer-events-none opacity-0 group-hover:opacity-100"></div>
              </div>
            </Field>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                validateType="name"
                placeholder="EX: JOHN"
                value={formData.firstName}
                onChange={(val) => setFormData({ ...formData, firstName: val })}
                required
              />
              <InputField
                label="Last Name"
                placeholder="EX: DOE"
                value={formData.lastName}
                onChange={(val) => setFormData({ ...formData, lastName: val })}
              />
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Email Address"
                validateType="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(val) => setFormData({ ...formData, email: val })}
                required
              />
              <InputField
                label="Phone Number"
                validateType="phone"
                placeholder="+92 XXX XXXXXXX"
                value={formData.phone}
                onChange={(val) => setFormData({ ...formData, phone: val })}
              />
            </div>

            {/* Gender Plan & Assign Trainner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field>
                <FieldLabel className="mb-1 text-slate-500 ml-2">
                  Gender
                </FieldLabel>
                <Select
                  value={formData.gender}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: value as "male" | "female" | "other",
                    })
                  }
                >
                  <SelectTrigger className="w-full !h-12 px-6 rounded-md border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem
                      value="male"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      MALE
                    </SelectItem>
                    <SelectItem
                      value="female"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      FEMALE
                    </SelectItem>
                    <SelectItem
                      value="other"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      OTHER
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="mb-1 text-slate-500 ml-2">
                  Membership Plan <span className="text-primary">*</span>
                </FieldLabel>
                <Select
                  value={formData.planId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, planId: value })
                  }
                >
                  <SelectTrigger className="w-full !h-12 px-6 rounded-md border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    {store.plans.map((plan) => (
                      <SelectItem
                        key={plan.id}
                        value={plan.id}
                        className="text-[10px] font-bold uppercase tracking-widest"
                      >
                        {plan.name.toUpperCase()} - Rs {plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel className="mb-1 text-slate-500 ml-2">
                  Assign Trainer
                </FieldLabel>
                <Select
                  value={formData.trainerId || "__none__"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      trainerId: value === "__none__" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger className="w-full !h-12 px-6 rounded-md border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem
                      value="__none__"
                      className="text-[10px] font-bold uppercase tracking-widest"
                    >
                      NO TRAINER ASSIGNED
                    </SelectItem>
                    {trainers.map((trainer) => (
                      <SelectItem
                        key={trainer._id || trainer.id}
                        value={trainer._id || trainer.id}
                        className="text-[10px] font-bold uppercase tracking-widest"
                      >
                        {trainer.fullName.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Notes */}
            <Field>
              <FieldLabel className=" text-slate-500 ml-2">
                Additional Notes
              </FieldLabel>
              <textarea
                placeholder="Any special requirements or notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full h-32 px-6 py-4 rounded-xl border-transparent bg-white/5 text-white font-bold text-[11px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </Field>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !formData.firstName}
                className="flex-1 h-11 bg-primary text-black hover:bg-white font-black tracking-tighter text-lg rounded-lg transition-all uppercase neon-glow z-20 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : null}
                {loading ? "Saving..." : "Add Member"}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: MEMBER PREVIEW */}
        <div className="space-y-4 md:space-y-8 sticky top-[94px]">
          {/* Preview Card */}
          <div className="bento-item border-primary/20 relative overflow-hidden group">
            {/* Background HUD elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-all duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

            <div className="relative p-4 md:p-8 space-y-4 md:space-y-8 glass-premium border-border dark:bg-slate-950/90 rounded-2xl overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] block">
                      Live Preview
                    </span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-foreground uppercase break-all leading-none">
                    {formData.firstName || "---"}_
                    <span className="text-primary">
                      {formData.lastName || "---"}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>
                      ID: GF-
                      {Math.random().toString(36).substr(2, 6).toUpperCase()}
                    </span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Photo Preview with Viewfinder */}
              <div className="flex justify-center py-4 relative">
                <div className="relative p-4">
                  {/* Outer Orbitals */}
                  <div className="absolute inset-0 border border-primary/10 rounded-full animate-spin-slow"></div>
                  <div className="absolute inset-2 border-t-2 border-primary/40 rounded-full animate-reverse-spin-slow"></div>

                  {/* Viewfinder Brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary group-hover:scale-110 transition-transform duration-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary group-hover:scale-110 transition-transform duration-500"></div>

                  <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-slate-900 shadow-[0_0_50px_rgba(76,255,0,0.1)] relative z-10 bg-slate-950 flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        className="w-full h-full object-cover grayscale brightness-110 contrast-125"
                        alt="HUD Preview"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-16 h-16 text-slate-800" />
                        <span className="text-[8px] font-black text-slate-700 tracking-[0.3em] uppercase">
                          No Signal
                        </span>
                      </div>
                    )}

                    {/* HUD Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 border-[20px] border-black/20 rounded-full pointer-events-none"></div>

                    {/* Scanning Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-primary/40 animate-scan pointer-events-none shadow-[0_0_15px_rgba(76,255,0,0.5)]"></div>

                    {/* Circular Stats HUD */}
                    <svg
                      className="absolute inset-0 w-full h-full -rotate-90 opacity-30"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-primary"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-8 border-t border-white/5 pt-8 relative">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-3 bg-primary/50"></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                        Contact Node
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 tracking-widest truncate flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                      {formData.email || "---"}
                    </p>
                    <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                      {formData.phone || "---"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1 h-3 bg-primary/50"></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                        Registry Info
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
                      <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                      {formData.gender || "---"}
                    </p>
                    <p className="text-xs font-bold text-slate-400 tracking-widest mt-1 uppercase flex items-center gap-2 truncate">
                      <span className="w-1 h-1 bg-primary/30 rounded-full"></span>
                      {(formData.planId &&
                        store.plans.find((p) => p.id === formData.planId)
                          ?.name) ||
                        "NO PLAN"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-black/40 rounded-xl p-5 border border-white/5 relative overflow-hidden group/status">
                <div className="absolute inset-0 bg-primary/5 translate-x-[-100%] group-hover/status:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex justify-between items-end mb-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Profile Completion
                    </span>
                    <div className="text-lg font-black text-foreground leading-none">
                      {Math.round(progress)}
                      <span className="text-primary">%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">
                      System Secured
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-primary/50 to-primary transition-all duration-1000 ease-out relative rounded-full"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full blur-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information Box */}
          <div className="bento-item p-6 bg-primary/5 border-primary/20 space-y-4">
            <div className="flex gap-4 items-start">
              <AlertCircle className="hidden md:block w-5 h-5 text-primary mt-1" />
              <div>
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                  Privacy Notice
                </h4>
                <p className="text-[10px] text-slate-400 font-normal md:font-bold uppercase tracking-wider leading-relaxed md:mt-1">
                  Please ensure all member details are accurate before
                  proceeding. Member information is stored securely according to
                  privacy standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
