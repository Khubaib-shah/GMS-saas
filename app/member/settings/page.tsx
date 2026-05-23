"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    ChevronLeft,
    User,
    Lock,
    Save,
    Eye,
    EyeOff,
    ShieldCheck,
    Loader2,
    Zap,
    Phone,
    Mail,
    KeyRound,
} from "lucide-react";

// ── Input with floating label ──────────────────────────────────────────────────
function PremiumInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    disabled,
    description,
    maxLength,
    suffix,
}: {
    label: string;
    type?: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    disabled?: boolean;
    description?: string;
    maxLength?: number;
    suffix?: React.ReactNode;
}) {
    return (
        <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={value}
                    onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                    placeholder={placeholder}
                    disabled={disabled}
                    maxLength={maxLength}
                    className="w-full h-12 px-4 rounded-2xl font-bold text-sm text-white placeholder:text-slate-700 transition-all outline-none border disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                        background: "rgba(255,255,255,0.04)",
                        borderColor: "rgba(255,255,255,0.08)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#FF6B35"; e.target.style.boxShadow = "0 0 0 3px rgba(255,107,53,0.15)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; }}
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
                )}
            </div>
            {description && <p className="text-[10px] font-medium text-slate-600 mt-1.5">{description}</p>}
        </div>
    );
}

export default function MemberSettingsPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");

    const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", email: "" });
    const [security, setSecurity] = useState({ password: "", confirmPassword: "", pin: "" });

    const fetchProfile = useCallback(async () => {
        if (status === "loading" && !localStorage.getItem("memberToken")) return;
        setIsLoading(true);
        let token = localStorage.getItem("memberToken");

        if (!token) {
            if (status === "authenticated" && (session?.user as any)?.memberToken) {
                token = (session.user as any).memberToken;
                localStorage.setItem("memberToken", token!);
            } else {
                router.push("/login");
                return;
            }
        }

        try {
            const res = await fetch("/api/member-portal/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401) { localStorage.removeItem("memberToken"); router.push("/login"); return; }
                throw new Error("Failed to load profile");
            }
            const data = await res.json();
            setProfile({ firstName: data.firstName || "", lastName: data.lastName || "", phone: data.phone || "", email: data.email || "" });
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    }, [router, session, status]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem("memberToken");
        try {
            const res = await fetch("/api/member-portal/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone }),
            });
            if (!res.ok) throw new Error("Update failed");
            toast.success("Profile updated successfully");
        } catch {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSecurityUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (security.password && security.password !== security.confirmPassword) {
            toast.error("Passwords do not match"); return;
        }
        if (security.pin && (security.pin.length < 4 || security.pin.length > 6)) {
            toast.error("PIN must be 4-6 digits"); return;
        }
        setIsSaving(true);
        const token = localStorage.getItem("memberToken");
        try {
            const res = await fetch("/api/member-portal/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ password: security.password || undefined, pin: security.pin || undefined }),
            });
            if (!res.ok) throw new Error("Security update failed");
            toast.success("Security settings updated");
            setSecurity({ password: "", confirmPassword: "", pin: "" });
        } catch {
            toast.error("Failed to update security settings");
        } finally {
            setIsSaving(false);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#080a0f" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)" }}>
                        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#FF6B35" }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white pb-24" style={{ background: "#080a0f" }}>

            {/* ── Sticky Header ────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-white/5"
                style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(20px)" }}>
                <div className="flex items-center gap-4 px-4 py-4 max-w-2xl mx-auto">
                    <button onClick={() => router.push("/member/dashboard")}
                        className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 active:scale-90 transition-transform flex-shrink-0">
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="font-black text-base text-white tracking-tight leading-none uppercase">
                            Account <span style={{ color: "#FF6B35" }}>Settings</span>
                        </h1>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Profile & Security</p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 px-4 pb-4 max-w-2xl mx-auto">
                    <button
                        onClick={() => setActiveTab("personal")}
                        className={`flex-1 h-10 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            activeTab === "personal" ? "text-black" : "text-slate-500 bg-white/5 border border-white/8"
                        }`}
                        style={activeTab === "personal" ? { background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" } : {}}
                    >
                        <User className="w-4 h-4" /> Personal
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`flex-1 h-10 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            activeTab === "security" ? "text-black" : "text-slate-500 bg-white/5 border border-white/8"
                        }`}
                        style={activeTab === "security" ? { background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" } : {}}
                    >
                        <ShieldCheck className="w-4 h-4" /> Security
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-5">

                {/* ── Personal Tab ───────────────────────────────────── */}
                {activeTab === "personal" && (
                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        {/* Profile card */}
                        <div className="rounded-3xl border border-white/5 overflow-hidden"
                            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                            {/* Avatar banner */}
                            <div className="relative h-24 flex items-end px-5 pb-4"
                                style={{ background: "linear-gradient(135deg, #1a0e06 0%, #2a1200 100%)" }}>
                                <div className="absolute inset-0 opacity-20"
                                    style={{ background: "radial-gradient(circle at 80% 50%, #FF6B35 0%, transparent 60%)" }} />
                                <div className="relative z-10 w-16 h-16 rounded-2xl border-2 border-white/10 flex items-center justify-center text-2xl font-black text-white uppercase"
                                    style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}>
                                    {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <PremiumInput
                                        label="First Name"
                                        value={profile.firstName}
                                        onChange={(v) => setProfile({ ...profile, firstName: v })}
                                        placeholder="First name"
                                    />
                                    <PremiumInput
                                        label="Last Name"
                                        value={profile.lastName}
                                        onChange={(v) => setProfile({ ...profile, lastName: v })}
                                        placeholder="Last name"
                                    />
                                </div>

                                <PremiumInput
                                    label="Email Address"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    description="Email cannot be changed."
                                    suffix={<Mail className="w-4 h-4 text-slate-600" />}
                                />

                                <PremiumInput
                                    label="Phone Number"
                                    type="tel"
                                    value={profile.phone}
                                    onChange={(v) => setProfile({ ...profile, phone: v })}
                                    placeholder="03XX-XXXXXXX"
                                    suffix={<Phone className="w-4 h-4 text-slate-600" />}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest text-black active:scale-95 transition-all disabled:opacity-60 shadow-[0_8px_30px_-6px_rgba(255,107,53,0.6)]"
                            style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}>
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSaving ? "Saving..." : "Save Profile"}
                        </button>
                    </form>
                )}

                {/* ── Security Tab ───────────────────────────────────── */}
                {activeTab === "security" && (
                    <form onSubmit={handleSecurityUpdate} className="space-y-5">
                        {/* Password card */}
                        <div className="rounded-3xl border border-white/5 p-5 space-y-4"
                            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                            <div>
                                <p className="font-black text-sm text-white uppercase tracking-tight">Change Password</p>
                                <p className="text-[10px] text-slate-600 font-medium mt-0.5">Leave blank to keep current password.</p>
                            </div>
                            <PremiumInput
                                label="New Password"
                                type={showPassword ? "text" : "password"}
                                value={security.password}
                                onChange={(v) => setSecurity({ ...security, password: v })}
                                placeholder="Enter new password"
                                suffix={
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="active:scale-90 transition-transform">
                                        {showPassword ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                                    </button>
                                }
                            />
                            <PremiumInput
                                label="Confirm Password"
                                type="password"
                                value={security.confirmPassword}
                                onChange={(v) => setSecurity({ ...security, confirmPassword: v })}
                                placeholder="Repeat new password"
                            />
                        </div>

                        {/* PIN card */}
                        <div className="rounded-3xl border border-white/5 p-5 space-y-4"
                            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                            <div>
                                <p className="font-black text-sm text-white uppercase tracking-tight">Quick Login PIN</p>
                                <p className="text-[10px] text-slate-600 font-medium mt-0.5">Set a 4-6 digit numeric PIN for fast access.</p>
                            </div>
                            <PremiumInput
                                label="Login PIN"
                                type="tel"
                                value={security.pin}
                                onChange={(v) => setSecurity({ ...security, pin: v })}
                                placeholder="4–6 digit PIN"
                                maxLength={6}
                                suffix={<KeyRound className="w-4 h-4 text-slate-600" />}
                            />
                        </div>

                        {/* Security note */}
                        <div className="flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/15"
                            style={{ background: "rgba(16,185,129,0.05)" }}>
                            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-black text-sm text-emerald-400 uppercase tracking-wider">End-to-End Security</p>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">Your personal information is securely encrypted at rest.</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-widest text-black active:scale-95 transition-all disabled:opacity-60 shadow-[0_8px_30px_-6px_rgba(255,107,53,0.6)]"
                            style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}>
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                            {isSaving ? "Saving..." : "Update Security"}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
}
