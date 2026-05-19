"use client";

import type React from "react";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Zap, Shield, ArrowRight, CheckCircle, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-md bg-[#c6ff00] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">
            Gym<span className="text-primary">Flow</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white mb-2">
          Welcome back
        </h1>
        <p className="text-[14px] text-white/40">
          Sign in to access your dashboard.
        </p>
      </div>

      {/* Form */}
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
            <a
              href="#"
              className="text-[12px] text-primary hover:text-white transition-colors"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <InputField
              type="password"
              validateType="password"
              placeholder="••••••••"
              value={password}
              onChange={(val) => setPassword(val)}
              hideLabel
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="btn-nav-secondary w-full"
        >
          {loading ? (
            <span className="flex items-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</span>
          ) : (
            <span className="flex items-center">Sign in <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2.5} /></span>
          )}
        </Button>
      </form>

      {/* Footer links */}
      <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col gap-3">
        <p className="text-center text-[13px] text-white/30">
          Are you a gym member?{" "}
          <Link href="/member/login" className="text-primary hover:text-white transition-colors font-medium">
            Go to Member Portal
          </Link>
        </p>
        <p className="text-center text-[13px] text-white/30">
          Need help?{" "}
          <a
            href="https://wa.me/923149784156"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-white transition-colors font-medium"
          >
            Contact support
          </a>
        </p>
      </div>

      {/* Suspended modal */}
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
            <span className="text-red-500/80 font-semibold uppercase text-[10px] tracking-widest">Reason:</span>{" "}
            <span className="text-white font-semibold">{suspensionReason}</span>
          </>
        }
        customActions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowSuspendedModal(false)}
              className="border border-white/10 text-white hover:bg-white/5 rounded-lg"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20am%20having%20issues%20with%20my%20suspended%20account.", "_blank")}
              className="bg-[#c6ff00] text-black hover:bg-[#d4ff33] rounded-lg font-semibold"
            >
              Contact support
            </Button>
          </>
        }
      />

      {/* Expired modal */}
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
            <span className="text-orange-500/80 font-semibold uppercase text-[10px] tracking-widest">Notice:</span>{" "}
            <span className="text-white font-semibold">Please renew to continue using GymFlow.</span>
          </>
        }
        customActions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowExpiredModal(false)}
              className="border border-white/10 text-white hover:bg-white/5 rounded-lg"
            >
              Close
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/923149784156?text=Hello%2C%20I%20would%20like%20to%20renew%20my%20gym%20subscription.", "_blank")}
              className="bg-[#c6ff00] text-black hover:bg-[#d4ff33] rounded-lg font-semibold"
            >
              Renew subscription
            </Button>
          </>
        }
      />
    </div>
  );
}

const brandPoints = [
  { icon: CheckCircle, text: "Member check-in in under 1 second" },
  { icon: CheckCircle, text: "Billing and payments, fully automated" },
  { icon: Shield, text: "Your data is always private and secure" },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 -z-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-3/5 relative items-center justify-center p-20 overflow-hidden border-r border-white/[0.06]">
        {/* Gym photo */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop"
            alt="Gym"
            className="w-full h-full object-cover opacity-20 grayscale"
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 rounded-lg bg-[#c6ff00] flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-[17px] tracking-tight text-white">
              Gym<span className="text-primary">Flow</span>
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-5xl font-bold tracking-[-0.04em] text-white leading-[1.05] mb-6">
            Stop losing money.<br />
            <span className="text-primary">Run your gym</span> smarter.
          </h2>

          <p className="text-[15px] text-white/80 leading-relaxed mb-12">
            Memberships, QR attendance, billing, point-of-sale, and workout tracking. All in one place.
          </p>

          {/* Feature points */}
          <div className="flex flex-col gap-4">
            {brandPoints.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <p.icon className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
                <span className="text-[14px] text-white/60">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-2/5 flex items-center justify-center px-8 py-16 relative z-10">
        <Suspense
          fallback={
            <div className="text-primary text-[13px] animate-pulse tracking-widest">
              Loading...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
