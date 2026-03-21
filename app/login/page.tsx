"use client";

import type React from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Shield, ArrowRight, Trophy, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredReason, setExpiredReason] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        if (result.error.startsWith("SUSPENDED:")) {
          setSuspensionReason(result.error.replace("SUSPENDED:", ""));
          setShowSuspendedModal(true);
        } else if (result.error.startsWith("EXPIRED:")) {
          setExpiredReason(result.error.replace("EXPIRED:", ""));
          setShowExpiredModal(true);
        } else {
          toast.error(result.error || "Invalid credentials. Try again.");
        }
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        toast.success("SYSTEM ACCESS GRANTED");
        if (callbackUrl && callbackUrl !== "/dashboard") {
          router.push(callbackUrl);
        } else if (session?.user?.role === "super_admin") {
          router.push("/super-admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Critical authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm glass-card p-10 selection:bg-primary selection:text-black">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 neon-glow">
          <Zap className="w-10 h-10 text-black" />
        </div>
        <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tight">
          System <span className="text-primary">Login</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Authorized Personnel Only</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
            Identity Email
          </label>
          <Input
            type="email"
            placeholder="ACCESS@GYMFLOW.COM"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold uppercase tracking-wider h-12 rounded-xl focus:bg-white/10"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Security Key
            </label>
            <a
              href="#"
              className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
            >
              Reset Key?
            </a>
          </div>
          <div className="relative group">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pr-12 bg-white/5 border-white/10 text-white placeholder:text-slate-700 font-bold h-12 rounded-xl focus:bg-white/10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-black hover:bg-white py-6 h-auto font-black italic text-lg rounded-xl neon-glow transition-all"
        >
          {loading ? "INITIALIZING..." : "INITIATE ACCESS"}
          {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
        </Button>
      </form>

      <div className="mt-10 pt-8 border-t border-white/5">
        <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Are you a Member?{" "}
          <Link href="/member/login" className="text-primary hover:text-white transition-colors">
            Go to Member Portal
          </Link>
        </p>
        <p className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest mt-4">
          No Access?{" "}
          <a href="https://wa.me/923149784156" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">
            Contact High Command
          </a>
        </p>
      </div>

      <AlertDialog open={showSuspendedModal} onOpenChange={setShowSuspendedModal}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2 uppercase tracking-tighter italic font-black text-2xl">
              <AlertCircle className="text-red-500 w-6 h-6" /> Account Suspended
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              Your gym account has been suspended by the administration.
              <br /><br />
              <span className="text-red-500/80 font-bold uppercase text-[10px] tracking-widest">Reason:</span>{" "}
              <span className="text-white font-bold">{suspensionReason}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowSuspendedModal(false)}
              className="bg-transparent border border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-wider"
            >
              Close
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20am%20having%20issues%20with%20my%20suspended%20account.", "_blank")}
              className="bg-primary text-black hover:bg-white font-black italic uppercase tracking-wider"
            >
              Contact Support
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showExpiredModal} onOpenChange={setShowExpiredModal}>
        <AlertDialogContent className="bg-slate-900 border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2 uppercase tracking-tighter italic font-black text-2xl">
              <AlertCircle className="text-orange-500 w-6 h-6" /> Account Expired
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              {expiredReason}
              <br /><br />
              <span className="text-orange-500/80 font-bold uppercase text-[10px] tracking-widest">Notice:</span>{" "}
              <span className="text-white font-bold">Please renew to continue accessing GymFlow.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowExpiredModal(false)}
              className="bg-transparent border border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-wider"
            >
              Close
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20would%20like%20to%20renew%20my%20gym%20subscription.", "_blank")}
              className="bg-primary text-black hover:bg-white font-black italic uppercase tracking-wider"
            >
              Renew Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(76,255,0,0.1),transparent_70%)]"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-40 -mb-40 animate-pulse"></div>

      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 grayscale contrast-150 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
            alt="Gym Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/80 to-transparent"></div>

        <div className="relative z-10 text-left max-w-xl">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center neon-glow">
              <Zap className="w-8 h-8 text-black" />
            </div>
            <span className="text-4xl font-black italic tracking-tighter text-white uppercase">
              GYM<span className="text-primary neon-text">FLOW</span>
            </span>
          </div>

          <h1 className="text-7xl font-black mb-6 italic text-white leading-[0.9] tracking-tighter uppercase">
            Dominate <br />
            The Every <br />
            <span className="text-primary neon-text">Rep.</span>
          </h1>

          <p className="text-xl text-slate-400 font-medium mb-12 max-w-md leading-relaxed">
            The elite management suite for gyms that demand absolute precision and high-octane growth.
          </p>

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <Trophy className="w-5 h-5" />, text: "Ranked #1 for Scaling Systems" },
              { icon: <Shield className="w-5 h-5" />, text: "Military-Grade Security" },
              { icon: <Zap className="w-5 h-5" />, text: "Instantaneous Data Retrieval" }
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

      {/* Right Side - Login Form area */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 relative z-10">
        <Suspense fallback={<div className="text-primary font-black italic animate-pulse tracking-widest uppercase text-xs">Synchronizing System...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
