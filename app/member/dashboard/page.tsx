"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Zap,
    Calendar,
    CreditCard,
    TrendingUp,
    Clock,
    LogOut,
    Flame,
    CalendarCheck,
    Pause,
    Download,
    History,
    Users,
    Activity,
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
}

export default function MemberDashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("memberToken");
        if (!token) {
            router.push("/member/login");
            return;
        }

        fetchDashboard(token);
    }, [router]);

    const fetchDashboard = async (token: string) => {
        try {
            const res = await fetch("/api/member-portal/dashboard", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem("memberToken");
                    router.push("/member/login");
                    return;
                }
                throw new Error("Failed to load level");
            }

            const dashboardData = await res.json();
            setData(dashboardData);
        } catch (error) {
            toast.error("Telemetry failed to load");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("memberToken");
        localStorage.removeItem("memberData");
        router.push("/member/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Zap className="h-10 w-10 text-primary animate-pulse neon-glow" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic">Synchronizing Data...</span>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <p className="text-red-500 font-black uppercase italic tracking-widest">CRITICAL ERROR: DATA LINK SEVERED</p>
            </div>
        );
    }

    const { member, subscription, plan, payments, attendance } = data;

    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-black pb-20">
            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary neon-glow">
                            <Zap className="h-7 w-7 text-black" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                                WELCOME, <span className="text-primary">{member.firstName}</span>
                            </h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Status: Active Beast</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 font-black uppercase italic text-[10px] tracking-widest rounded-xl">
                        <LogOut className="h-4 w-4 mr-2" />
                        TERMINATE SESSION
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 space-y-10">
                {/* Stats Cards */}
                <div className="grid gap-6 md:grid-cols-4">
                    <div className="glass-card p-6 border-l-4 border-l-primary">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subscription</p>
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        {subscription ? (
                            <div className="space-y-3">
                                <div className="flex items-end gap-2">
                                    <span className="text-4xl font-black italic text-white line-height-1">
                                        {subscription.daysUntilExpiry}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">Days Left</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className={cn(
                                        "uppercase font-black text-[9px] tracking-widest px-2 py-0.5 rounded-md",
                                        subscription.status === "active" ? "bg-primary text-black" : "bg-red-500 text-white"
                                    )}>
                                        {subscription.status}
                                    </Badge>
                                    {subscription.isPaused && (
                                        <Badge variant="secondary" className="uppercase font-black text-[9px] tracking-widest px-2 py-0.5 bg-white/5 text-amber-500 border border-amber-500/30">
                                            <Pause className="h-2 w-2 mr-1" />
                                            PAUSED
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500 font-bold italic text-sm">NO ACTIVE LINK</p>
                        )}
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-blue-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Plan</p>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </div>
                        {plan ? (
                            <div>
                                <div className="text-2xl font-black italic uppercase text-white truncate mb-1">{plan.name}</div>
                                <p className="text-[10px] font-black text-blue-500 tracking-widest uppercase italic">
                                    {plan.price} PKR / {plan.duration} DAYS
                                </p>
                            </div>
                        ) : (
                            <p className="text-slate-500 font-bold italic text-sm">NO PLAN DETECTED</p>
                        )}
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-orange-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Heat Streak</p>
                            <Flame className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black italic text-orange-500">{member.attendanceStreak}</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">Days</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-2 italic">Maintain the momentum 🔥</p>
                    </div>

                    <div className="glass-card p-6 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Check-Ins</p>
                            <CalendarCheck className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="text-4xl font-black italic text-white mb-2">{member.totalCheckIns}</div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest italic">Since {new Date(member.joinDate).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid gap-10 lg:grid-cols-3">
                    {/* QR Code Card */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-8 h-full flex flex-col items-center justify-center text-center">
                            <div className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-6">Digital ID</div>
                            <h3 className="text-2xl font-black italic uppercase text-white mb-8 tracking-tighter">ACCESS SCAN</h3>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)] mb-8 transition-transform hover:scale-105 duration-500">
                                <QRCode
                                    value={member.qrCode || member.id}
                                    size={180}
                                    level="H"
                                    fgColor="#000000"
                                />
                            </div>
                            
                            <p className="text-[10px] font-mono font-bold text-slate-500 mb-8 uppercase tracking-widest bg-white/5 py-2 px-4 rounded-lg">
                                {member.qrCode || member.id}
                            </p>
                            
                            <Button className="w-full bg-white text-black hover:bg-primary py-6 rounded-xl font-black italic transition-all gap-3" onClick={() => {
                                const svg = document.querySelector(".bg-white svg");
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
                                    toast.error("Generation link offline");
                                }
                            }}>
                                <Download className="h-5 w-5" />
                                DOWNLOAD ACCESS PASS
                            </Button>
                        </div>
                    </div>

                    {/* Tabs for History */}
                    <div className="lg:col-span-2">
                        <div className="glass-card h-full flex flex-col">
                           <Tabs defaultValue="attendance" className="flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-3 bg-white/5 border-b border-white/10 rounded-t-2xl overflow-hidden p-0 h-16">
                                    <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-none font-black italic text-[11px] uppercase tracking-widest transition-all h-full">
                                        <History className="w-4 h-4 mr-2 hidden sm:block" />
                                        ATTENDANCE
                                    </TabsTrigger>
                                    <TabsTrigger value="payments" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-none font-black italic text-[11px] uppercase tracking-widest transition-all h-full">
                                        <CreditCard className="w-4 h-4 mr-2 hidden sm:block" />
                                        PAYMENTS
                                    </TabsTrigger>
                                    <TabsTrigger value="pauses" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black rounded-none font-black italic text-[11px] uppercase tracking-widest transition-all h-full">
                                        <Pause className="w-4 h-4 mr-2 hidden sm:block" />
                                        PAUSES
                                    </TabsTrigger>
                                </TabsList>

                                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                    <TabsContent value="attendance" className="mt-0 space-y-3">
                                        {attendance.length === 0 ? (
                                            <div className="py-20 text-center opacity-20 italic">No mission logs detected</div>
                                        ) : (
                                            attendance.map((record) => (
                                                <div key={record.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-green-500 border border-white/5">
                                                            <CalendarCheck className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black italic uppercase text-sm">{new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                                {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                                                                {record.checkOutTime && ` → ${new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="font-black text-[9px] tracking-widest border-white/10 uppercase italic">{record.status}</Badge>
                                                </div>
                                            ))
                                        )}
                                    </TabsContent>

                                    <TabsContent value="payments" className="mt-0 space-y-3">
                                        {payments.length === 0 ? (
                                            <div className="py-20 text-center opacity-20 italic">No credit transactions detected</div>
                                        ) : (
                                            payments.map((payment) => (
                                                <div key={payment.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-blue-500 border border-white/5">
                                                            <TrendingUp className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black italic text-lg text-white">{payment.amount} PKR</p>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
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
                                            <div className="py-20 text-center opacity-20 italic">No operational holds detected</div>
                                        ) : (
                                            subscription.pauseHistory.map((pause, index) => (
                                                <div key={index} className="flex items-start gap-5 p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-amber-500/30 transition-all">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-amber-500 border border-white/5 shrink-0">
                                                        <Pause className="h-6 w-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-black italic uppercase text-sm">System Freeze</p>
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                                                    {new Date(pause.startDate).toLocaleDateString()}
                                                                    {pause.endDate ? ` — ${new Date(pause.endDate).toLocaleDateString()}` : " (ONGOING)"}
                                                                </p>
                                                            </div>
                                                            {pause.endDate && (
                                                                <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-black italic text-[9px]">
                                                                    {(() => {
                                                                        const days = Math.floor((new Date(pause.endDate).getTime() - new Date(pause.startDate).getTime()) / (1000 * 60 * 60 * 24));
                                                                        return days > 0 ? `${days} DAYS` : "< 1 DAY";
                                                                    })()}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {pause.reason && (
                                                            <p className="text-[11px] font-bold text-slate-400 bg-black/40 p-3 rounded-xl italic">
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
                                <h3 className="text-2xl font-black italic uppercase text-amber-500 mb-2 tracking-tighter">OPERATIONAL FREEZE DETECTED</h3>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Your tactical data link is currently suspended. Contact Command Center to initiate manual reactivation.
                                    {subscription.totalPausedDays > 0 && (
                                        <span className="text-white block mt-1">TOTAL DURATION SUSPENDED: {subscription.totalPausedDays} CYCLES</span>
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
