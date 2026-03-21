"use client";

import type React from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Shield, ArrowRight, Trophy, Building2, Mail, Lock, User as UserIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    gymName: "",
  });
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan") || "professional";
  const planName = rawPlan.charAt(0).toUpperCase() + rawPlan.slice(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePreSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleSignup = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      const regRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, planName }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        throw new Error(regData.message || "Registration failed");
      }

      toast.success("Account created! Redirecting to payment...");

      if (regData.checkoutUrl) {
        window.location.href = regData.checkoutUrl;
      } else {
        router.push("/login?message=Account created. Please login to subscribe.");
      }

    } catch (error: any) {
      toast.error(error.message || "Critical registration error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-md glass-card p-10 selection:bg-primary selection:text-black">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 neon-glow">
            <Zap className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tight">
            System <span className="text-primary">Signup</span>
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Start Your {planName} Journey</p>
        </div>

        <form onSubmit={handlePreSignup} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3 h-3 text-primary" /> Gym Name
            </label>
            <Input
              name="gymName"
              placeholder="TITAN FITNESS CENTER"
              value={formData.gymName}
              onChange={handleChange}
              className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold uppercase tracking-wider h-12 rounded-xl focus:bg-white/10"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <UserIcon className="w-3 h-3 text-primary" /> Full Name
            </label>
            <Input
              name="fullName"
              placeholder="JOHN DOE"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold uppercase tracking-wider h-12 rounded-xl focus:bg-white/10"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Mail className="w-3 h-3 text-primary" /> Email
            </label>
            <Input
              name="email"
              type="email"
              placeholder="BOSS@GYMFLOW.COM"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold uppercase tracking-wider h-12 rounded-xl focus:bg-white/10"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3 h-3 text-primary" /> Security Key (Password)
            </label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold h-12 rounded-xl focus:bg-white/10"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="md:col-span-2 bg-primary text-black hover:bg-white py-6 h-auto font-black italic text-lg rounded-xl neon-glow transition-all mt-4"
          >
            {loading ? "INITIALIZING ACCOUNT..." : "START SUBSCRIPTION"}
            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-white transition-colors">
              Initiate Access
            </Link>
          </p>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2 uppercase tracking-tighter italic font-black text-2xl">
              <AlertCircle className="text-primary w-6 h-6" /> Confirm Identifier
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              You are about to register with <span className="text-white font-bold">{formData.email}</span>. 
              <br /><br />
              <span className="text-primary/80 font-bold uppercase text-[10px] tracking-widest">Crucial Note:</span> You will <span className="text-white underline underline-offset-4 font-black italic">NOT</span> be able to change this email address later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-wider">
              Revise
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignup}
              className="bg-primary text-black hover:bg-white font-black italic uppercase tracking-wider"
            >
              Confirm & Pay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(76,255,0,0.1),transparent_70%)]"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-40 -mb-40 animate-pulse"></div>

      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 grayscale contrast-150 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
            alt="Gym Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>

        <div className="relative z-10 text-left max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center neon-glow">
              <Zap className="w-8 h-8 text-black" />
            </div>
            <span className="text-4xl font-black italic tracking-tighter text-white uppercase">
              GYM<span className="text-primary neon-text">FLOW</span>
            </span>
          </div>

          <h1 className="text-6xl font-black mb-6 italic text-white leading-[0.9] tracking-tighter uppercase">
            Build Your <br />
            Legacy <br />
            <span className="text-primary neon-text">Today.</span>
          </h1>

          <p className="text-xl text-slate-400 font-medium mb-12 max-w-md leading-relaxed">
            Join the elite network of gym owners using GymFlow to automate, scale, and dominate their local markets.
          </p>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <Trophy className="w-5 h-5" />, text: "Instant ROI for New Branches" },
              { icon: <Shield className="w-5 h-5" />, text: "PCI Compliant Payments" },
              { icon: <Zap className="w-5 h-5" />, text: "Global Scaling Infrastructure" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-white/70">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                  {item.icon}
                </div>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form area */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <Suspense fallback={<div className="text-primary font-black italic animate-pulse tracking-widest uppercase text-xs">Calibrating Signup Matrix...</div>}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
