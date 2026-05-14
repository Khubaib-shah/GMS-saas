"use client";

import type React from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap, Shield, CheckCircle, ArrowRight,
  Eye, EyeOff, AlertCircle, Loader2,
  Mail, Lock, Hash,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

// ─── Staff Login Form ───────────────────────────────────────────────────────
function StaffForm() {
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
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl });
      if (result?.error) {
        if (result.error.startsWith("SUSPENDED:")) {
          setSuspensionReason(result.error.replace("SUSPENDED:", ""));
          setShowSuspendedModal(true);
        } else if (result.error.startsWith("EXPIRED:")) {
          setExpiredReason(result.error.replace("EXPIRED:", ""));
          setShowExpiredModal(true);
        } else {
          toast.error(result.error || "Wrong email or password. Please try again.");
        }
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        toast.success("You are signed in.");
        if (callbackUrl && callbackUrl !== "/dashboard") {
          router.push(callbackUrl);
        } else if (session?.user?.role === "super_admin") {
          router.push("/super-admin");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <InputField
          label="Email or Phone"
          className="gap-1.5"
          validateType="text"
          placeholder="Email or phone number"
          value={email}
          onChange={(val) => setEmail(val)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-white/50">Password</span>
            <a href="#" className="text-[12px] text-[#c6ff00] hover:text-white transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
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
              className="absolute right-12 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors z-20"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#c6ff00] text-black hover:bg-[#d4ff33] font-semibold text-[14px] rounded-lg transition-colors mt-1"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2.5} /></>
          )}
        </Button>
      </form>

      {/* Suspended modal */}
      <ConfirmModal
        open={showSuspendedModal}
        onOpenChange={setShowSuspendedModal}
        title="Account" highlight="Suspended" icon={AlertCircle} variant="destructive"
        description={<>Your gym account has been suspended by the administration.<br /><br /><span className="text-red-500/80 font-semibold text-[10px] uppercase tracking-widest">Reason:</span>{" "}<span className="text-white font-semibold">{suspensionReason}</span></>}
        customActions={<>
          <Button variant="outline" onClick={() => setShowSuspendedModal(false)} className="border border-white/10 text-white hover:bg-white/5 rounded-lg">Close</Button>
          <Button onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20am%20having%20issues%20with%20my%20suspended%20account.", "_blank")} className="bg-[#c6ff00] text-black hover:bg-[#d4ff33] rounded-lg font-semibold">Contact support</Button>
        </>}
      />

      {/* Expired modal */}
      <ConfirmModal
        open={showExpiredModal}
        onOpenChange={setShowExpiredModal}
        title="Account" highlight="Expired" icon={AlertCircle} variant="warning"
        description={<>{expiredReason}<br /><br /><span className="text-orange-500/80 font-semibold text-[10px] uppercase tracking-widest">Notice:</span>{" "}<span className="text-white font-semibold">Please renew to continue using GymFlow.</span></>}
        customActions={<>
          <Button variant="outline" onClick={() => setShowExpiredModal(false)} className="border border-white/10 text-white hover:bg-white/5 rounded-lg">Close</Button>
          <Button onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20would%20like%20to%20renew%20my%20gym%20subscription.", "_blank")} className="bg-[#c6ff00] text-black hover:bg-[#d4ff33] rounded-lg font-semibold">Renew subscription</Button>
        </>}
      />
    </>
  );
}

// ─── Member Login Form ──────────────────────────────────────────────────────
function MemberForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const gymId = typeof window !== "undefined" ? localStorage.getItem("memberGymId") : null;

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please enter your email and password."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/member-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, gymId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Login failed."); return; }
      localStorage.setItem("memberToken", data.token);
      localStorage.setItem("memberData", JSON.stringify(data.member));
      localStorage.setItem("memberGymId", data.member.gymId);
      toast.success("Welcome back!");
      router.push("/member/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) { toast.error("Please enter your email and PIN."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/member-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin, gymId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Login failed."); return; }
      localStorage.setItem("memberToken", data.token);
      localStorage.setItem("memberData", JSON.stringify(data.member));
      localStorage.setItem("memberGymId", data.member.gymId);
      toast.success("Welcome back!");
      router.push("/member/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs defaultValue="password" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 h-10 mb-6">
        <TabsTrigger
          value="password"
          className="text-[12px] font-semibold rounded-md data-[state=active]:bg-[#c6ff00] data-[state=active]:text-black text-white/40 transition-all"
        >
          Password
        </TabsTrigger>
        <TabsTrigger
          value="pin"
          className="text-[12px] font-semibold rounded-md data-[state=active]:bg-[#c6ff00] data-[state=active]:text-black text-white/40 transition-all"
        >
          Fast PIN
        </TabsTrigger>
      </TabsList>

      {/* Password tab */}
      <TabsContent value="password">
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
          <InputField
            label="Email address"
            validateType="email"
            placeholder="your@email.com"
            value={email}
            onChange={(val) => setEmail(val)}
            leadingIcon={<Mail className="h-4 w-4" />}
            required
            autoFocus
          />
          <div className="relative">
            <InputField
              label="Password"
              validateType="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(val) => setPassword(val)}
              leadingIcon={<Lock className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[42px] -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors z-20"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#c6ff00] text-black hover:bg-[#d4ff33] font-semibold text-[14px] rounded-lg transition-colors"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : <>Sign in <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2.5} /></>}
          </Button>
        </form>
      </TabsContent>

      {/* PIN tab */}
      <TabsContent value="pin">
        <form onSubmit={handlePinLogin} className="flex flex-col gap-5">
          <InputField
            label="Email address"
            validateType="email"
            placeholder="your@email.com"
            value={email}
            onChange={(val) => setEmail(val)}
            leadingIcon={<Mail className="h-4 w-4" />}
            required
          />
          <div className="relative">
            <InputField
              label="Your PIN"
              validateType="number"
              type={showPin ? "text" : "password"}
              placeholder="••••"
              maxLength={6}
              value={pin}
              onChange={(val) => setPin(val.replace(/\D/g, ""))}
              leadingIcon={<Hash className="h-4 w-4" />}
              required
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-4 top-[42px] -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors z-20"
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-[#c6ff00] text-black hover:bg-[#d4ff33] font-semibold text-[14px] rounded-lg transition-colors"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : <>Sign in with PIN <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2.5} /></>}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}

// ─── Unified Login Shell ────────────────────────────────────────────────────
function UnifiedLoginForm() {
  const [activeTab, setActiveTab] = useState<"staff" | "member">("staff");

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-7 h-7 rounded-md bg-[#c6ff00] flex items-center justify-center">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-[15px] tracking-tight text-white">
          Gym<span className="text-[#c6ff00]">Flow</span>
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-3xl font-bold tracking-[-0.03em] text-white mb-1">Welcome back</h1>
      <p className="text-[14px] text-white/40 mb-8">Sign in to your account.</p>

      {/* Top-level role switcher */}
      <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-lg p-1 mb-8">
        {(["staff", "member"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 h-9 rounded-md text-[13px] font-semibold transition-all ${
              activeTab === tab
                ? "bg-[#c6ff00] text-black"
                : "text-white/40 hover:text-white"
            }`}
          >
            {tab === "staff" ? "Staff / Admin" : "Gym Member"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "staff" ? <StaffForm /> : <MemberForm />}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col gap-3">
        <p className="text-center text-[13px] text-white/30">
          Need help?{" "}
          <a
            href="https://wa.me/923149784156"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c6ff00] hover:text-white transition-colors font-medium"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
const brandPoints = [
  { icon: CheckCircle, text: "Member check-in in under 1 second" },
  { icon: CheckCircle, text: "Billing and payments, fully automated" },
  { icon: Shield, text: "Your data is always private and secure" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-20 overflow-hidden border-r border-white/[0.06]">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
            alt="Gym"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-lg bg-[#c6ff00] flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white">
              Gym<span className="text-[#c6ff00]">Flow</span>
            </span>
          </div>

          <h2 className="text-5xl font-bold tracking-[-0.04em] text-white leading-[1.05] mb-6">
            Stop losing money.<br />
            <span className="text-[#c6ff00]">Run your gym</span> smarter.
          </h2>

          <p className="text-[15px] text-white/40 leading-relaxed mb-12">
            Memberships, QR attendance, billing, point-of-sale, and workout tracking. All in one place.
          </p>

          <div className="flex flex-col gap-4">
            {brandPoints.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <p.icon className="w-4 h-4 text-[#c6ff00] shrink-0" strokeWidth={2} />
                <span className="text-[14px] text-white/60">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-16 relative z-10">
        <Suspense fallback={<div className="text-[#c6ff00] text-[13px] animate-pulse">Loading...</div>}>
          <UnifiedLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
