"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Dumbbell,
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
} from "lucide-react";
import QRCode from "react-qr-code";

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
                throw new Error("Failed to load dashboard");
            }

            const dashboardData = await res.json();
            setData(dashboardData);
        } catch (error) {
            toast.error("Failed to load dashboard");
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Failed to load dashboard</p>
            </div>
        );
    }

    const { member, subscription, plan, payments, attendance } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                            <Dumbbell className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-semibold">
                                Welcome, {member.firstName}!
                            </h1>
                            <p className="text-sm text-muted-foreground">Member Portal</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {subscription ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold">
                                            {subscription.daysUntilExpiry}
                                        </span>
                                        <span className="text-muted-foreground">days left</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge
                                            variant={
                                                subscription.status === "active"
                                                    ? "default"
                                                    : subscription.status === "paused"
                                                    ? "secondary"
                                                    : "destructive"
                                            }
                                        >
                                            {subscription.isPaused && <Pause className="h-3 w-3 mr-1" />}
                                            {subscription.status}
                                        </Badge>
                                        {subscription.isPaused && (
                                            <span className="text-xs text-muted-foreground">
                                                Since {new Date(subscription.currentPauseStart!).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    {subscription.totalPausedDays > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Extended by {subscription.totalPausedDays} days (paused)
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">No active subscription</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {plan ? (
                                <>
                                    <div className="text-2xl font-bold">{plan.name}</div>
                                    <p className="text-sm text-muted-foreground">
                                        ${plan.price} / {plan.duration} days
                                    </p>
                                </>
                            ) : (
                                <p className="text-muted-foreground">No plan</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Attendance Streak</CardTitle>
                            <Flame className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{member.attendanceStreak} days</div>
                            <p className="text-sm text-muted-foreground">
                                Keep it up! 💪
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
                            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{member.totalCheckIns}</div>
                            <p className="text-sm text-muted-foreground">
                                Since {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* QR Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Member QR Code</CardTitle>
                        <CardDescription>Use this code to check in at the gym</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <QRCode
                                value={member.qrCode || member.id}
                                size={200}
                                level="H"
                            />
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground font-mono">
                            {member.qrCode || member.id}
                        </p>
                        <Button variant="outline" className="mt-4 gap-2" onClick={() => {
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
                                    downloadLink.download = `member-qr-${member.firstName}.png`;
                                    downloadLink.href = pngFile;
                                    downloadLink.click();
                                };
                                img.src = "data:image/svg+xml;base64," + btoa(svgData);
                            } else {
                                toast.error("Could not generate image");
                            }
                        }}>
                            <Download className="h-4 w-4" />
                            Download QR Code
                        </Button>
                    </CardContent>
                </Card>

                {/* Tabs for History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Activity</CardTitle>
                        <CardDescription>Your recent attendance and payment history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="attendance">
                            <TabsList>
                                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                                <TabsTrigger value="payments">Payments</TabsTrigger>
                                <TabsTrigger value="pauses">Pause History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="attendance" className="mt-4">
                                {attendance.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No attendance records yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {attendance.map((record) => (
                                            <div
                                                key={record.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CalendarCheck className="h-5 w-5 text-green-500" />
                                                    <div>
                                                        <p className="font-medium">
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Check-in: {new Date(record.checkInTime).toLocaleTimeString()}
                                                            {record.checkOutTime &&
                                                                ` • Check-out: ${new Date(record.checkOutTime).toLocaleTimeString()}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">{record.status}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="payments" className="mt-4">
                                {payments.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No payment records yet
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {payments.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CreditCard className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="font-medium">
                                                            ${payment.amount.toFixed(2)}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(payment.date).toLocaleDateString()} •{" "}
                                                            {payment.method}
                                                        </p>
                                                    </div>
                                                </div>
                                                {payment.receiptNumber && (
                                                    <span className="text-sm text-muted-foreground">
                                                        #{payment.receiptNumber}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="pauses" className="mt-4">
                                {(!subscription?.pauseHistory || subscription.pauseHistory.length === 0) ? (
                                    <p className="text-muted-foreground text-center py-8">
                                        No pause history
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {subscription.pauseHistory.map((pause, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                                            >
                                                <div className="mt-1 bg-amber-100 text-amber-600 rounded-full p-2">
                                                    <Pause className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">Subscription Paused</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {new Date(pause.startDate).toLocaleDateString()}
                                                                {pause.endDate ? ` - ${new Date(pause.endDate).toLocaleDateString()}` : " (Current)"}
                                                            </p>
                                                        </div>
                                                        {pause.endDate && (
                                                            <Badge variant="outline">
                                                                {(() => {
                                                                    const days = Math.floor((new Date(pause.endDate).getTime() - new Date(pause.startDate).getTime()) / (1000 * 60 * 60 * 24));
                                                                    return days > 0 ? `${days} days` : "< 1 day";
                                                                })()}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {pause.reason && (
                                                        <p className="text-sm mt-2 text-muted-foreground bg-background/50 p-2 rounded">
                                                            "{pause.reason}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Paused Subscription Notice */}
                {subscription?.isPaused && (
                    <Card className="border-yellow-500/50 bg-yellow-500/10">
                        <CardContent className="flex items-center gap-4 py-4">
                            <Pause className="h-8 w-8 text-yellow-600" />
                            <div>
                                <h3 className="font-semibold">Subscription Paused</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your subscription is currently paused. Contact the gym to resume.
                                    {subscription.totalPausedDays > 0 && (
                                        <> Total paused days: {subscription.totalPausedDays}</>
                                    )}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </div>
    );
}
