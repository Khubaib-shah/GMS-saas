"use client";

import type React from "react";
import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import {
  Shield,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

type LoginMode =
  | "LOGIN"
  | "FORGOT_EMAIL"
  | "FORGOT_OTP"
  | "FORGOT_NEW_PASSWORD";

function LoginForm() {
  const [mode, setMode] = useState<LoginMode>("LOGIN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Also used for PIN
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resetToken, setResetToken] = useState("");

  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [expiredReason, setExpiredReason] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();

  // Timer effect for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

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
          toast.error(
            result.error || "Wrong email or password. Please try again.",
          );
        }
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        toast.success("You are signed in.");

        const role = session?.user?.role;
        if (role === "super_admin") {
          router.push("/super-admin");
        } else if (role === "member") {
          if (session?.user?.memberToken) {
            localStorage.setItem("memberToken", session.user.memberToken);
          }
          router.push("/member/dashboard");
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

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");

      toast.success("OTP sent to your email.");
      setMode("FORGOT_OTP");
      setCountdown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");

      setResetToken(data.token);
      setMode("FORGOT_NEW_PASSWORD");
      toast.success("OTP verified. You can now reset your password.");
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: resetToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");

      toast.success("Password reset successful! Logging you in...");

      // Auto login after reset
      const result = await signIn("credentials", {
        email,
        password: newPassword,
        redirect: false,
      });

      if (!result?.error) {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;
        if (role === "super_admin") {
          router.push("/super-admin");
        } else if (role === "member") {
          if (session?.user?.memberToken) {
            localStorage.setItem("memberToken", session.user.memberToken);
          }
          router.push("/member/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setMode("LOGIN");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex justify-center">
          <div className="w-3/4">
            <img
              src="/assets/logo/left&right.png"
              alt="Logo"
              className="w-full h-full object-contain translate-x-[-10%]"
            />
          </div>
        </div>

        {mode === "LOGIN" && <></>}
        {mode !== "LOGIN" && (
          <>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white mb-2">
              Reset Password
            </h1>
            <p className="text-[14px] text-white/40">
              {mode === "FORGOT_EMAIL" &&
                "Enter your email to receive a recovery code."}
              {mode === "FORGOT_OTP" &&
                "Enter the 6-digit code sent to your email."}
              {mode === "FORGOT_NEW_PASSWORD" &&
                "Create a new strong password."}
            </p>
          </>
        )}
      </div>

      {/* Forms */}
      {mode === "LOGIN" && (
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
              <span className="text-[12px] font-medium text-white/80 ml-2">
                Password or PIN
              </span>
              <button
                type="button"
                onClick={() => setMode("FORGOT_EMAIL")}
                className="text-[12px] text-primary hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <InputField
                type={showPassword ? "text" : "password"}
                validateType="text"
                placeholder="••••••••"
                value={password}
                onChange={(val) => setPassword(val)}
                hideLabel
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn-nav-secondary w-full"
          >
            {loading ? (
              <span className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...
              </span>
            ) : (
              <span className="flex items-center">
                Sign in{" "}
                <ArrowRight className="ml-2 w-4 h-4" strokeWidth={2.5} />
              </span>
            )}
          </Button>
        </form>
      )}

      {mode === "FORGOT_EMAIL" && (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
          <InputField
            label="Email Address"
            className="gap-1.5"
            validateType="email"
            placeholder="Enter your email"
            value={email}
            onChange={(val) => setEmail(val)}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="btn-nav-secondary w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <span>Get a Recovery Code</span>
            )}
          </Button>
          <button
            type="button"
            onClick={() => setMode("LOGIN")}
            className="text-xs text-white/40 hover:text-white mt-2"
          >
            Back to login
          </button>
        </form>
      )}

      {mode === "FORGOT_OTP" && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          <InputField
            label="6-Digit OTP"
            className="gap-1.5 tracking-[0.5em] text-center font-bold"
            validateType="number"
            placeholder="••••••"
            maxLength={6}
            value={otp}
            onChange={(val) => setOtp(val.replace(/\D/g, ""))}
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="btn-nav-secondary w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <span>Verify Code</span>
            )}
          </Button>
          <div className="flex flex-col items-center gap-2 mt-2">
            {countdown > 0 ? (
              <p className="text-xs text-white/40">
                Code expires in{" "}
                <span className="text-primary font-bold">{countdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={loading}
                className="text-xs text-primary hover:text-white transition-colors"
              >
                Resend Code
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode("LOGIN")}
              className="text-xs text-white/40 hover:text-white mt-2"
            >
              Back to login
            </button>
          </div>
        </form>
      )}

      {mode === "FORGOT_NEW_PASSWORD" && (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
          <div className="relative">
            <InputField
              label="New Password"
              className="gap-1.5"
              type={showPassword ? "text" : "password"}
              validateType="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(val) => setNewPassword(val)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-slate-500 hover:text-white transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <InputField
              label="Confirm Password"
              className="gap-1.5"
              type={showPassword ? "text" : "password"}
              validateType="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(val) => setConfirmPassword(val)}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="btn-nav-secondary w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      )}

      {/* Footer links */}
      {mode === "LOGIN" && (
        <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col gap-3">
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
      )}

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
            <br />
            <br />
            <span className="text-red-500/80 font-semibold uppercase text-[10px] tracking-widest">
              Reason:
            </span>{" "}
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
              onClick={() =>
                window.open(
                  "https://wa.me/923149784156?text=Hello%2C%20I%20am%20having%20issues%20with%20my%20suspended%20account.",
                  "_blank",
                )
              }
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
            <br />
            <br />
            <span className="text-orange-500/80 font-semibold uppercase text-[10px] tracking-widest">
              Notice:
            </span>{" "}
            <span className="text-white font-semibold">
              Please renew to continue using GymFlow.
            </span>
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
              onClick={() =>
                window.open(
                  "https://wa.me/923149784156?text=Hello%2C%20I%20would%20like%20to%20renew%20my%20gym%20subscription.",
                  "_blank",
                )
              }
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
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
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
          <div className="flex items-center">
            <div className="w-3/4">
              <img
                src="/assets/logo/left&right.png"
                alt="Logo"
                className="w-full h-full object-contain translate-x-[-10%]"
              />
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-5xl font-bold tracking-[-0.04em] text-white leading-[1.05] mb-6">
            Stop losing money.
            <br />
            <span className="text-primary">Run your gym</span> smarter.
          </h2>

          <p className="text-[15px] text-white/80 leading-relaxed mb-12">
            Memberships, QR attendance, billing, point-of-sale, and workout
            tracking. All in one place.
          </p>

          {/* Feature points */}
          <div className="flex flex-col gap-4">
            {brandPoints.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <p.icon
                  className="w-4 h-4 text-primary shrink-0"
                  strokeWidth={2}
                />
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
