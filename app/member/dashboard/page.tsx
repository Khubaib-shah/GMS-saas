"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
    Users,
    Activity,
    Dumbbell,
    RefreshCcw,
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
}

export default function MemberDashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem("memberToken");
        if (!token) {
            router.push("/member/login");
            return;
        }

        try {
            const res = await fetch("/api/member-portal/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 404) {
                    localStorage.removeItem("memberToken");
                    localStorage.removeItem("memberData");
                    router.push("/member/login");
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
    }, [router]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const handleLogout = () => {
        localStorage.removeItem("memberToken");
        localStorage.removeItem("memberData");
        router.push("/member/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="h-10 w-10 text-primary animate-pulse neon-glow" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Loading your dashboard...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-red-500 font-black uppercase tracking-widest text-xl">UNABLE TO LOAD DASHBOARD</p>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Failed to load member data.</p>
                    <p className="text-[10px] text-slate-700 font-mono mt-2 uppercase tracking-tight">Please try logging in again.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={fetchDashboard}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/5 font-black uppercase tracking-widest rounded-xl gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        RETRY
                    </Button>
                    <Button
                        onClick={() => {
                            localStorage.removeItem("memberToken");
                            localStorage.removeItem("memberData");
                            router.push("/member/login");
                        }}
                        className="bg-primary text-black hover:bg-white font-black uppercase tracking-widest rounded-xl"
                    >
                        RETURN TO LOGIN
                    </Button>
                </div>
            </div>
        );
    }

    const { member, subscription, plan, payments, attendance } = data;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground pb-20">
            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary neon-glow transition-transform hover:scale-105">
                            <Zap className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
                                Welcome, <span className="text-primary">{member.firstName}</span>
                            </h1>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Membership Status: Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/member/settings")}
                            className="text-slate-400 hover:text-primary hover:bg-white/5 font-black uppercase text-[10px] tracking-widest rounded-xl"
                        >
                            <User className="h-4 w-4 mr-2" />
                            PROFILE
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest rounded-xl"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            LOGOUT
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 space-y-10">
                {subscription && subscription.daysUntilExpiry <= 3 && subscription.daysUntilExpiry > 0 && (
                    <div className="glass-premium border-l-4 border-l-red-500 p-6 flex items-center justify-between gap-6 animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center neon-glow-red animate-pulse">
                                <Flame className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase text-red-500 tracking-tighter">Your membership is expiring soon!</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Only {subscription.daysUntilExpiry} days remaining. Renew at the reception to avoid interruption.</p>
                            </div>
                        </div>
                        <Activity className="w-10 h-10 text-red-500/20" />
                    </div>
                )}
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4">
                    <div className="glass-premium p-6 border-l-4 border-l-primary">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Subscription</p>
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        {subscription ? (
                            <div className="space-y-3">
                                <div className="flex items-end gap-2">
                                    <span className={cn(
                                        "text-4xl font-black line-height-1",
                                        subscription.daysUntilExpiry <= 3 ? "text-red-500" : "text-foreground"
                                    )}>
                                        {subscription.daysUntilExpiry}
                                    </span>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pb-1">Days Left</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn(
                                        "uppercase font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md",
                                        subscription.status === "active" ? "bg-primary text-primary-foreground" : "bg-red-500 text-white"
                                    )}>
                                        {subscription.status}
                                    </Badge>
                                    {subscription.isPaused && (
                                        <Badge variant="secondary" className="uppercase font-black text-[9px] tracking-widest px-2 py-0.5 bg-black/5 dark:bg-white/5 text-amber-500 border border-amber-500/30">
                                            <Pause className="h-2 w-2 mr-1" />
                                            PAUSED
                                        </Badge>
                                    )}
                                </div>
                                {subscription.daysUntilExpiry > 0 && subscription.daysUntilExpiry <= 3 && (
                                    <div className="pt-2 animate-pulse">
                                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                            <Flame className="w-3 h-3" />
                                            Expiring scan! Renew soon
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground font-bold text-sm">No Active Subscription</p>
                        )}
                    </div>

                    <div className="glass-premium p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Plan</p>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </div>
                        {plan ? (
                            <div>
                                <div className="text-2xl font-black uppercase text-foreground truncate mb-1">{plan.name}</div>
                                <p className="text-[10px] font-black text-blue-500 tracking-widest uppercase italic">
                                    {plan.price} PKR / {plan.duration} DAYS
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground font-bold text-sm">No active plan detected</p>
                        )}
                    </div>

                    <div className="glass-premium p-6 border-l-4 border-l-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Attendance Streak</p>
                            <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black text-orange-500">{member.attendanceStreak}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">Days</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-2 italic">Consistent attendance</p>
                    </div>

                    <div className="glass-premium p-6 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Check-Ins</p>
                            <CalendarCheck className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="text-4xl font-black text-foreground mb-2">{member.totalCheckIns}</div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Since {new Date(member.joinDate).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid gap-10 lg:grid-cols-3">
                    {/* QR Code Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-premium p-8 flex flex-col items-center justify-center text-center">
                            <div className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6">Membership QR</div>
                            <h3 className="text-2xl font-black uppercase text-foreground mb-8 tracking-tighter">Membership QR Code</h3>

                            <div ref={qrRef} className="bg-white p-6 rounded-2xl shadow-[0_0_50px_-10px_rgba(0,0,0,0.1)] mb-8 transition-transform hover:scale-105 duration-500">
                                <QRCode
                                    value={member.qrCode || member.id}
                                    size={180}
                                    level="H"
                                    fgColor="#000000"
                                />
                            </div>

                            <p className="text-[10px] font-mono font-bold text-muted-foreground mb-8 uppercase tracking-widest bg-black/5 dark:bg-white/5 py-2 px-4 rounded-lg">
                                {member.qrCode || member.id}
                            </p>

                            <Button className="w-full bg-white text-black hover:bg-primary py-6 rounded-xl font-black transition-all gap-3" onClick={() => {
                                const svg = qrRef.current?.querySelector("svg");
                                if (svg) {
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();
                                    img.onload = () => {
                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        ctx?.drawImage(img, 0, 0);
                                        const pngFile = canvas.toDataURL("image/png");
                                        const downloadLink = document.createElement("a");
                                        downloadLink.download = `GYMFLOW-QR-${member.firstName}.png`;
                                        downloadLink.href = pngFile;
                                        downloadLink.click();
                                    };
                                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                } else {
                                    toast.error("QR generation error");
                                }
                            }}>
                                <Download className="h-5 w-5" />
                                DOWNLOAD QR CODE
                            </Button>
                        </div>
                    </div>

                    {/* Tabs for History */}
                    <div className="lg:col-span-2">
                        <div className="glass-card h-full flex flex-col">
                            <Tabs defaultValue="attendance" className="flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-4 bg-white/5 border-b border-white/10 rounded-t-2xl overflow-hidden p-0 h-16">
                                    <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-none font-black text-[11px] uppercase tracking-widest transition-all h-full">
                                        <History className="w-4 h-4 mr-2 hidden sm:block" />
                                        RECENT ATTENDANCE
                                    </TabsTrigger>
                                    <TabsTrigger value="workouts" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white rounded-none font-black text-[11px] uppercase tracking-widest transition-all h-full">
                                        <Dumbbell className="w-4 h-4 mr-2 hidden sm:block" />
                                        WORKOUTS
                                    </TabsTrigger>
                                    <TabsTrigger value="payments" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none font-black text-[11px] uppercase tracking-widest transition-all h-full">
                                        <CreditCard className="w-4 h-4 mr-2 hidden sm:block" />
                                        PAYMENTS
                                    </TabsTrigger>
                                    <TabsTrigger value="pauses" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-none font-black text-[11px] uppercase tracking-widest transition-all h-full">
                                        <Pause className="w-4 h-4 mr-2 hidden sm:block" />
                                        PAUSES
                                    </TabsTrigger>
                                </TabsList>

                                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                    <TabsContent value="attendance" className="mt-0 space-y-3">
                                        {attendance.length === 0 ? (
                                            <div className="py-20 text-center opacity-20 text-foreground">No attendance records found</div>
                                        ) : (
                                            attendance.map((record) => (
                                                <div key={record.id} className="flex items-center justify-between p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-green-500 border border-border">
                                                            <CalendarCheck className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black uppercase text-sm text-foreground">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                                                {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {record.checkOutTime && ` → ${new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="font-black text-[9px] tracking-widest border-border text-foreground uppercase italic">{record.status}</Badge>
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>

                                    <TabsContent value="workouts" className="mt-0 space-y-4">
                                        {!data.workoutPlan ? (
                                            <div className="py-20 text-center flex flex-col items-center">
                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-500">
                                                    <Dumbbell className="w-8 h-8" />
                                                </div>
                                                <div className="opacity-40 font-black text-foreground uppercase tracking-widest">No Workout Plan Assigned</div>
                                                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Contact your trainer to assign a workout plan.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xl font-black uppercase text-foreground">{data.workoutPlan.name}</h3>
                                                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest italic">{data.workoutPlan.schedule.length} Active Days</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {data.workoutPlan.schedule.map((day) => (
                                                        <div key={day._id} className="glass-card bg-black/5 dark:bg-white/5 border border-white/10 overflow-hidden">
                                                            <div className="bg-purple-500/10 px-4 py-4 border-b border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                                <div>
                                                                    <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">{day.day}</span>
                                                                    <h4 className="text-sm font-black text-white uppercase tracking-wider italic">{day.title}</h4>
                                                                </div>
                                                                <Button
                                                                    onClick={() => router.push("/member/workout")}
                                                                    className="bg-purple-500 text-white hover:bg-white hover:text-black font-black text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl neon-glow transition-all"
                                                                >
                                                                    <Zap className="w-3.5 h-3.5 mr-2" />
                                                                    START WORKOUT
                                                                </Button>
                                                            </div>
                                                            <div className="divide-y divide-white/5">
                                                                {day.exercises.map((ex, idx) => (
                                                                    <div key={idx} className="p-4 hover:bg-white/5 transition-colors group">
                                                                        <div className="flex items-start gap-4">
                                                                            {ex.exercise?.gifUrl ? (
                                                                                <div className="w-16 h-16 rounded-lg bg-black/20 overflow-hidden shrink-0 border border-white/10">
                                                                                    <img src={ex.exercise.gifUrl} alt={ex.exercise.name} className="w-full h-full object-cover" />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-16 h-16 rounded-lg bg-black/20 flex items-center justify-center shrink-0 border border-white/10 text-slate-600">
                                                                                    <Dumbbell className="w-6 h-6" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-black text-sm text-foreground uppercase truncate">{ex.exercise?.name || "Unknown Exercise"}</h4>
                                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-[9px] font-bold uppercase tracking-widest border-0">
                                                                                        {ex.sets} SETS
                                                                                    </Badge>
                                                                                    <Badge variant="secondary" className="bg-white/10 text-slate-300 hover:bg-white/20 text-[9px] font-bold uppercase tracking-widest border-0">
                                                                                        {ex.reps} REPS
                                                                                    </Badge>
                                                                                    {ex.notes && (
                                                                                        <span className="text-[9px] text-slate-500 truncate max-w-full">NOTE: {ex.notes}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="payments" className="mt-0 space-y-3">
                                        {payments.length === 0 ? (
                                            <div className="py-20 text-center opacity-20 text-foreground">No payment history found</div>
                                        ) : (
                                            payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border group hover:border-blue-500/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-blue-500 border border-border">
                                                            <TrendingUp className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-lg text-foreground">{payment.amount} PKR</p>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                                                {new Date(payment.date).toLocaleDateString()} • {payment.method}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {payment.receiptNumber && (
                                                        <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full uppercase tracking-tighter italic">#{payment.receiptNumber}</span>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>

                                    <TabsContent value="pauses" className="mt-0 space-y-3">
                                        {(!subscription?.pauseHistory || subscription.pauseHistory.length === 0) ? (
                                            <div className="py-20 text-center opacity-20 text-foreground">No subscription pauses found</div>
                                        ) : (
                                            subscription.pauseHistory.map((pause, index) => (
                                                <div key={index} className="flex items-start gap-5 p-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-border group hover:border-amber-500/30 transition-all">
                                                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-amber-500 border border-border shrink-0">
                                                        <Pause className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-black uppercase text-sm text-foreground">Subscription Paused</p>
                                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                                                                    {new Date(pause.startDate).toLocaleDateString()}
                                                                    {pause.endDate ? ` — ${new Date(pause.endDate).toLocaleDateString()}` : " (ONGOING)"}
                                                                </p>
                                                            </div>
                                                            {pause.endDate && (
                                                                <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-black text-[9px]">
                                                                    {(() => {
                                                                        const days = Math.floor((new Date(pause.endDate).getTime() - new Date(pause.startDate).getTime()) / (1000 * 60 * 60 * 24));
                                                                        return days > 0 ? `${days} DAYS` : "< 1 DAY";
                                                                    })()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {pause.reason && (
                                                            <p className="text-[11px] font-bold text-muted-foreground bg-black/5 dark:bg-black/40 p-3 rounded-xl italic">
                                                                "{pause.reason.toUpperCase()}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Paused Subscription Notice */}
                {subscription?.isPaused && (
                    <div className="glass shadow-[0_0_40px_-10px_rgba(245,158,11,0.2)] border-amber-500/30 rounded-3xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
                        <div className="flex items-center gap-6 p-8">
                            <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 neon-glow animate-pulse">
                                <Pause className="h-8 w-8 text-black" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase text-amber-500 mb-2 tracking-tighter">SUBSCRIPTION PAUSED</h3>
                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    Your subscription is currently paused. Contact administration to resume it.
                                    {subscription.totalPausedDays > 0 && (
                                        <span className="text-foreground block mt-1">TOTAL DAYS PAUSED: {subscription.totalPausedDays} DAYS</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
