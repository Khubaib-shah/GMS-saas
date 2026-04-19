"use client";

import type React from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Zap, Shield, ArrowRight, Trophy, Eye, EyeOff, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

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
        toast.success("Login successful");
        if (callbackUrl && callbackUrl !== "/dashboard") {
          router.push(callbackUrl);
        } else if (session?.user?.role === "super_admin") {
          router.push("/super-admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm glass-card p-10 selection:bg-primary selection:text-black">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black italic text-white mb-2 uppercase tracking-tight">
          Welcome <span className="text-primary">Back</span>
        </h2>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sign in to access your dashboard</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <InputField
          label="Email"
          className="gap-0"
          validateType="email"
          placeholder="your@email.com"
          value={email}
          onChange={(val) => setEmail(val)}
          required
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="ml-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Password
            </span>
            <a
              href="#"
              className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
            >
              Reset Password?
            </a>
          </div>
          <div className="relative group/password">
            <InputField
              type={showPassword ? "text" : "password"}
              validateType="password"
              placeholder="••••••••"
              value={password}
              onChange={(val) => setPassword(val)}
              hideLabel
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors z-20"
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
          {loading ? "Logging in..." : "Login"}
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
          Need Help?{" "}
          <a href="https://wa.me/923149784156" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">
            Contact Support
          </a>
        </p>
      </div>

      <ConfirmModal
        open={showSuspendedModal}
        onOpenChange={setShowSuspendedModal}
        title="Account"
        highlight="Suspended"
        icon={AlertCircle}
        variant="destructive"
        description={
          <>
            Your gym account has been suspended by the administration.
            <br /><br />
            <span className="text-red-500/80 font-bold uppercase text-[10px] tracking-widest">Reason:</span>{" "}
            <span className="text-white font-bold">{suspensionReason}</span>
          </>
        }
        customActions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowSuspendedModal(false)}
              className="bg-transparent border border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-wider rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20am%20having%20issues%20with%20my%20suspended%20account.", "_blank")}
              className="bg-primary text-black hover:bg-white font-black italic uppercase tracking-wider rounded-xl"
            >
              Contact Support
            </Button>
          </>
        }
      />

      <ConfirmModal
        open={showExpiredModal}
        onOpenChange={setShowExpiredModal}
        title="Account"
        highlight="Expired"
        icon={AlertCircle}
        variant="warning"
        description={
          <>
            {expiredReason}
            <br /><br />
            <span className="text-orange-500/80 font-bold uppercase text-[10px] tracking-widest">Notice:</span>{" "}
            <span className="text-white font-bold">Please renew to continue accessing GymFlow.</span>
          </>
        }
        customActions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowExpiredModal(false)}
              className="bg-transparent border border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-wider rounded-xl"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20would%20like%20to%20renew%20my%20gym%20subscription.", "_blank")}
              className="bg-primary text-black hover:bg-white font-black italic uppercase tracking-wider rounded-xl"
            >
              Renew Subscription
            </Button>
          </>
        }
      />
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

            Powerful gym management for growth and precision.

          <div className="grid grid-cols-1 gap-6">
            {[
              { icon: <Trophy className="w-5 h-5" />, text: "Built for scaling businesses" },
              { icon: <Shield className="w-5 h-5" />, text: "Secure and Reliable" },
              { icon: <Zap className="w-5 h-5" />, text: "Fast and Responsive" }
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
        <Suspense fallback={<div className="text-primary font-black italic animate-pulse tracking-widest uppercase text-xs">Loading application...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
