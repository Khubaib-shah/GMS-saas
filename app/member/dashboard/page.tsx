"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import {
    Zap,
    User,
    Calendar,
    CreditCard,
    TrendingUp,
    LogOut,
    Flame,
    CalendarCheck,
    Pause,
    Download,
    History,
    Activity,
    Dumbbell,
    RefreshCcw,
    ShoppingBag,
    Settings,
    ChevronRight,
    Clock,
    CheckCircle2,
} from "lucide-react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";

interface DashboardData {
    member: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        photoBase64?: string;
        joinDate: string;
        qrCode?: string;
        attendanceStreak: number;
        totalCheckIns: number;
        lastCheckIn?: string;
    };
    subscription: {
        id: string;
        planId: string;
        startDate: string;
        endDate: string;
        originalEndDate?: string;
        status: string;
        totalPausedDays: number;
        daysUntilExpiry: number;
        isPaused: boolean;
        currentPauseStart?: string;
        pauseHistory?: Array<{
            startDate: string;
            endDate?: string;
            reason?: string;
            pausedBy?: string;
        }>;
    } | null;
    plan: {
        id: string;
        name: string;
        price: number;
        duration: number;
        description?: string;
    } | null;
    payments: Array<{
        id: string;
        amount: number;
        date: string;
        method: string;
        receiptNumber?: string;
        description?: string;
    }>;
    attendance: Array<{
        id: string;
        date: string;
        checkInTime: string;
        checkOutTime?: string;
        status: string;
    }>;
    workoutPlan: {
        id: string;
        name: string;
        description?: string;
        schedule: Array<{
            _id: string;
            day: string;
            title: string;
            exercises: Array<{
                exercise: {
                    id: string;
                    name: string;
                    muscleGroup: string;
                    gifUrl: string;
                    equipment?: string;
                } | null;
                sets: number;
                reps: string;
                restSeconds: number;
                notes?: string;
            }>;
        }>;
    } | null;
    orders: Array<{
        id: string;
        receiptNumber: string;
        finalAmount: number;
        status: string;
        createdAt: string;
        items: Array<{
            name: string;
            quantity: number;
            subtotal: number;
        }>;
    }>;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent: string }) {
    return (
        <div className="p-4 rounded-2xl border border-white/5 flex flex-col gap-1"
            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: accent }}>{label}</p>
            <p className="text-3xl font-black text-white tracking-tight leading-none">{value}</p>
            {sub && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{sub}</p>}
        </div>
    );
}

export default function MemberDashboardPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const fetchDashboard = useCallback(async () => {
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
            const res = await fetch("/api/member-portal/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                if (res.status === 401 || res.status === 404) {
                    localStorage.removeItem("memberToken");
                    localStorage.removeItem("memberData");
                    router.push("/login");
                    return;
                }
                throw new Error("Failed to load dashboard");
            }
            const dashboardData = await res.json();
            setData(dashboardData);
        } catch (error) {
            toast.error("Dashboard data failed to load");
        } finally {
            setIsLoading(false);
        }
    }, [router, session, status]);

    useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

    const handleLogout = async () => {
        localStorage.removeItem("memberToken");
        localStorage.removeItem("memberData");
        await signOut({ callbackUrl: "/login" });
    };

    // ── Loading State ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#080a0f" }}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)" }}>
                        <Zap className="w-8 h-8 animate-pulse" style={{ color: "#FF6B35" }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // ── Error State ──────────────────────────────────────────────────────────
    if (!data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6" style={{ background: "#080a0f" }}>
                <p className="text-red-500 font-black uppercase tracking-widest text-xl text-center">Unable to Load</p>
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest text-center">Failed to load member data.</p>
                <div className="flex gap-4">
                    <Button onClick={fetchDashboard} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black uppercase tracking-widest rounded-xl gap-2">
                        <RefreshCcw className="w-4 h-4" /> RETRY
                    </Button>
                    <Button onClick={async () => {
                        localStorage.removeItem("memberToken");
                        localStorage.removeItem("memberData");
                        await signOut({ callbackUrl: "/login" });
                    }} className="font-black uppercase tracking-widest rounded-xl"
                        style={{ background: "#FF6B35", color: "black" }}>
                        RE-LOGIN
                    </Button>
                </div>
            </div>
        );
    }

    const { member, subscription, plan, payments, attendance, orders } = data;
    const daysLeft = subscription?.daysUntilExpiry ?? 0;
    const isExpiringSoon = daysLeft <= 3 && daysLeft > 0;

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen text-white pb-28" style={{ background: "#080a0f" }}>

            {/* ── Sticky Header ─────────────────────────────────────── */}
            <header className="sticky top-0 z-50 border-b border-white/5"
                style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(20px)" }}>
                <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}>
                            <Zap className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <h1 className="font-black text-base text-white tracking-tight leading-none">
                                Hey, <span style={{ color: "#FF6B35" }}>{member.firstName}</span> 👋
                            </h1>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">Member Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.push("/member/store")}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 active:scale-90 transition-transform">
                            <ShoppingBag className="w-4 h-4 text-slate-400" />
                        </button>
                        <button onClick={() => router.push("/member/settings")}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 active:scale-90 transition-transform">
                            <Settings className="w-4 h-4 text-slate-400" />
                        </button>
                        <button onClick={handleLogout}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-red-500/20 active:scale-90 transition-transform"
                            style={{ background: "rgba(239,68,68,0.08)" }}>
                            <LogOut className="w-4 h-4 text-red-400" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

                {/* ── Expiry Warning ─────────────────────────────────── */}
                {isExpiringSoon && (
                    <div className="p-4 rounded-2xl border border-red-500/25 flex items-center gap-4"
                        style={{ background: "rgba(239,68,68,0.07)" }}>
                        <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                            <Flame className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-red-400 uppercase tracking-wide">Expiring in {daysLeft} day{daysLeft !== 1 ? "s" : ""}!</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Renew at reception to avoid interruption.</p>
                        </div>
                    </div>
                )}

                {/* ── Paused Notice ──────────────────────────────────── */}
                {subscription?.isPaused && (
                    <div className="p-4 rounded-2xl border border-amber-500/25 flex items-center gap-4"
                        style={{ background: "rgba(245,158,11,0.07)" }}>
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <Pause className="w-5 h-5 text-black" />
                        </div>
                        <div>
                            <p className="font-black text-sm text-amber-400 uppercase tracking-wide">Subscription Paused</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Contact administration to resume.</p>
                        </div>
                    </div>
                )}

                {/* ── Hero Plan Card ─────────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden p-6"
                    style={{
                        background: "linear-gradient(135deg, #1a0e06 0%, #2a1200 100%)",
                        border: "1px solid rgba(255,107,53,0.2)"
                    }}>
                    <div className="absolute inset-0 opacity-20"
                        style={{ background: "radial-gradient(circle at 80% 50%, #FF6B35 0%, transparent 60%)" }} />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#FF6B35" }}>
                                {plan ? plan.name : "No Active Plan"}
                            </p>
                            <h2 className="text-4xl font-black text-white leading-none tracking-tighter">
                                {daysLeft > 0 ? daysLeft : "—"}
                            </h2>
                            <p className="text-xs font-bold text-slate-400 mt-1">Days Remaining</p>
                            {subscription && (
                                <div className="mt-3 flex items-center gap-2">
                                    <div className={`px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                                        subscription.isPaused ? "bg-amber-500/20 text-amber-400" :
                                        subscription.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                                        "bg-red-500/20 text-red-400"
                                    }`}>
                                        {subscription.isPaused ? "Paused" : subscription.status}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold">
                                        Ends {new Date(subscription.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)" }}>
                            <Calendar className="w-8 h-8" style={{ color: "#FF6B35" }} />
                        </div>
                    </div>
                </div>

                {/* ── Stats Row ──────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    <StatCard label="Streak" value={`${member.attendanceStreak}🔥`} sub="Days in a row" accent="#FF6B35" />
                    <StatCard label="Total Check-Ins" value={member.totalCheckIns} sub={`Since ${new Date(member.joinDate).toLocaleDateString()}`} accent="#10b981" />
                </div>

                {/* ── Quick Actions ──────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => router.push("/member/store")}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 active:scale-95 transition-all"
                        style={{ background: "rgba(255,107,53,0.07)", borderColor: "rgba(255,107,53,0.15)" }}>
                        <ShoppingBag className="w-5 h-5 flex-shrink-0" style={{ color: "#FF6B35" }} />
                        <div className="text-left min-w-0">
                            <p className="font-black text-xs text-white uppercase tracking-wider">Store</p>
                            <p className="text-[10px] text-slate-600 font-medium">Shop Products</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                    </button>
                    <button onClick={() => router.push("/member/settings")}
                        className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 active:scale-95 transition-all"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <Settings className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <div className="text-left min-w-0">
                            <p className="font-black text-xs text-white uppercase tracking-wider">Settings</p>
                            <p className="text-[10px] text-slate-600 font-medium">Profile & Security</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                    </button>
                </div>

                {/* ── QR Code Card ───────────────────────────────────── */}
                <div className="rounded-3xl border border-white/5 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                    <div className="p-5 border-b border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Membership QR</p>
                        <h3 className="font-black text-base text-white uppercase tracking-tight">Your Digital Pass</h3>
                    </div>
                    <div className="p-6 flex flex-col items-center gap-5">
                        <div ref={qrRef} className="bg-white p-4 rounded-2xl shadow-[0_0_60px_-10px_rgba(255,107,53,0.2)]">
                            <QRCode 
                                value={member.qrCode || member.id} 
                                style={{ height: "100%", maxWidth: "100%", width: "100%", maxHeight: "100%" }}
                                viewBox={`0 0 256 256`}
                                level="H" 
                                fgColor="#000000" 
                            />
                        </div>
                        <p className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl w-full text-center truncate">
                            {member.qrCode || member.id}
                        </p>
                        <button
                            onClick={() => {
                                const svg = qrRef.current?.querySelector("svg");
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width; canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL("image/png");
                                        const a = document.createElement("a");
                                        a.download = `GYM-QR-${member.firstName}.png`;
                                        a.href = pngFile; a.click();
                                    };
                                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                } else { toast.error("QR generation error"); }
                            }}
                            className="w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest text-black active:scale-95 transition-all shadow-[0_4px_20px_-4px_rgba(255,107,53,0.5)] flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}>
                            <Download className="w-4 h-4" />
                            Download QR Code
                        </button>
                    </div>
                </div>

                {/* ── History Tabs ───────────────────────────────────── */}
                <div className="rounded-3xl border border-white/5 overflow-hidden"
                    style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                    <Tabs defaultValue="attendance">
                        <TabsList className="grid w-full grid-cols-5 bg-transparent border-b border-white/5 rounded-none p-0 h-12">
                            {[
                                { value: "attendance", label: "Gym", icon: History, color: "#FF6B35" },
                                { value: "workouts", label: "Plan", icon: Dumbbell, color: "#a855f7" },
                                { value: "payments", label: "Paid", icon: CreditCard, color: "#3b82f6" },
                                { value: "pauses", label: "Pause", icon: Pause, color: "#f59e0b" },
                                { value: "orders", label: "Orders", icon: ShoppingBag, color: "#FF6B35" },
                            ].map(({ value, label, icon: Icon, color }) => (
                                <TabsTrigger
                                    key={value}
                                    value={value}
                                    className="rounded-none h-full flex flex-col gap-0.5 font-black text-[9px] uppercase tracking-widest transition-all data-[state=active]:text-white data-[state=active]:border-b-2 border-b-2 border-transparent text-slate-600"
                                    style={{ "--tw-ring-color": color } as any}
                                >
                                    <Icon className="w-3.5 h-3.5 data-[state=active]:opacity-100 opacity-60" />
                                    {label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="p-4 space-y-3">
                            {/* Attendance */}
                            <TabsContent value="attendance" className="mt-0 space-y-3">
                                {attendance.length === 0 ? (
                                    <div className="py-16 text-center text-slate-700 font-black text-xs uppercase tracking-widest">No records yet</div>
                                ) : attendance.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                                <CalendarCheck className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm text-white uppercase">
                                                    {new Date(record.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {new Date(record.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                    {record.checkOutTime && ` → ${new Date(record.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500">{record.status}</span>
                                    </div>
                                ))}
                            </TabsContent>

                            {/* Workouts */}
                            <TabsContent value="workouts" className="mt-0 space-y-4">
                                {!data.workoutPlan ? (
                                    <div className="py-16 text-center flex flex-col items-center gap-3">
                                        <Dumbbell className="w-10 h-10 text-slate-800" />
                                        <p className="text-slate-700 font-black text-xs uppercase tracking-widest">No Workout Plan</p>
                                        <p className="text-slate-800 text-[10px]">Contact your trainer to assign one.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-black text-base text-white uppercase tracking-tight">{data.workoutPlan.name}</h3>
                                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">{data.workoutPlan.schedule.length} Active Days</p>
                                        </div>
                                        {data.workoutPlan.schedule.map((day) => (
                                            <div key={day._id} className="rounded-2xl overflow-hidden border border-purple-500/20">
                                                <div className="px-4 py-3 flex items-center justify-between" style={{ background: "rgba(168,85,247,0.1)" }}>
                                                    <div>
                                                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{day.day}</span>
                                                        <h4 className="font-black text-sm text-white uppercase">{day.title}</h4>
                                                    </div>
                                                    <button onClick={() => router.push(`/member/workout?day=${day.day.toLowerCase()}`)}
                                                        className="h-9 px-4 rounded-xl bg-purple-500 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3" /> Start
                                                    </button>
                                                </div>
                                                <div className="divide-y divide-white/5">
                                                    {day.exercises.map((ex, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3">
                                                            {ex.exercise?.gifUrl ? (
                                                                <div className="w-12 h-12 rounded-xl bg-black/20 overflow-hidden border border-white/10 flex-shrink-0">
                                                                    <img src={ex.exercise.gifUrl} alt={ex.exercise.name} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                                                    <Dumbbell className="w-5 h-5 text-slate-600" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black text-sm text-white uppercase truncate">{ex.exercise?.name || "Unknown"}</p>
                                                                <div className="flex gap-2 mt-1">
                                                                    <span className="text-[9px] font-black bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg">{ex.sets} SETS</span>
                                                                    <span className="text-[9px] font-black bg-white/10 text-slate-400 px-2 py-0.5 rounded-lg">{ex.reps} REPS</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Payments */}
                            <TabsContent value="payments" className="mt-0 space-y-3">
                                {payments.length === 0 ? (
                                    <div className="py-16 text-center text-slate-700 font-black text-xs uppercase tracking-widest">No payments yet</div>
                                ) : payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-black text-base text-white">PKR {payment.amount.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {new Date(payment.date).toLocaleDateString()} · {payment.method}
                                                </p>
                                            </div>
                                        </div>
                                        {payment.receiptNumber && (
                                            <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-xl uppercase tracking-widest">
                                                #{payment.receiptNumber}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </TabsContent>

                            {/* Pauses */}
                            <TabsContent value="pauses" className="mt-0 space-y-3">
                                {(!subscription?.pauseHistory || subscription.pauseHistory.length === 0) ? (
                                    <div className="py-16 text-center text-slate-700 font-black text-xs uppercase tracking-widest">No pauses recorded</div>
                                ) : subscription.pauseHistory.map((pause, index) => (
                                    <div key={index} className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                                            <Pause className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-black text-sm text-white uppercase">Subscription Paused</p>
                                                {pause.endDate && (
                                                    <span className="text-[9px] font-black bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-lg">
                                                        {Math.max(0, Math.floor((new Date(pause.endDate).getTime() - new Date(pause.startDate).getTime()) / 86400000))}D
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                                {new Date(pause.startDate).toLocaleDateString()}
                                                {pause.endDate ? ` – ${new Date(pause.endDate).toLocaleDateString()}` : " (ongoing)"}
                                            </p>
                                            {pause.reason && <p className="text-xs text-slate-400 italic mt-1 bg-black/30 px-3 py-1.5 rounded-xl">{pause.reason}</p>}
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>

                            {/* Orders */}
                            <TabsContent value="orders" className="mt-0 space-y-3">
                                {(!orders || orders.length === 0) ? (
                                    <div className="py-16 text-center flex flex-col items-center gap-3">
                                        <ShoppingBag className="w-10 h-10 text-slate-800" />
                                        <p className="text-slate-700 font-black text-xs uppercase tracking-widest">No orders yet</p>
                                        <button onClick={() => router.push("/member/store")}
                                            className="h-10 px-5 rounded-xl font-black text-xs uppercase tracking-widest text-black active:scale-95 transition-transform"
                                            style={{ background: "#FF6B35" }}>
                                            Browse Store
                                        </button>
                                    </div>
                                ) : orders.map((order) => (
                                    <div key={order.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                        <div className="flex items-start justify-between mb-3 pb-3 border-b border-white/5">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Order {order.receiptNumber}</p>
                                                <p className="font-black text-sm text-white uppercase mt-0.5">
                                                    {new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 ${
                                                order.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                                                order.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                                                "bg-red-500/15 text-red-400"
                                            }`}>
                                                {order.status === "completed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {order.status}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 mb-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-xs">
                                                    <span className="text-slate-400 font-bold">{item.quantity}× {item.name}</span>
                                                    <span className="text-white font-black">PKR {item.subtotal.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between pt-3 border-t border-white/5">
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Total</span>
                                            <span className="font-black text-sm" style={{ color: "#FF6B35" }}>PKR {order.finalAmount.toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

            </main>
        </div>
    );
}
