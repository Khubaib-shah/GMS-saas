"use client";

import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntry } from "@/components/attendance/manual-entry";
import { AttendanceScanner } from "@/components/attendance/attendance-scanner";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { DashboardHeader } from "@/components/dashboard-header";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Lock, Sparkles, Filter, Search } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default function AttendancePage() {
    const store = useAppStore();
    const { data: session } = useSession();
    const isPremium = (session?.user as any)?.isPremium;
    const canScan = store.gymProfile?.enabledFeatures?.includes("qrAttendance") || store.gymProfile?.enabledFeatures?.includes("attendance") || isPremium;
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                store.loadGymProfile(),
                store.loadMembers()
            ]);
            setLoading(false);
        };
        loadData();
    }, []);

    const [activeTab, setActiveTab] = useState("mark");

    useEffect(() => {
        if (activeTab === 'reports' && store.gymProfile?._id) {
            fetchReports();
        }
    }, [activeTab, store.gymProfile?._id]);

    const fetchReports = async () => {
        if (!store.gymProfile?._id) return;
        setLoadingReports(true);
        try {
            // Default to today
            const today = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/attendance/report?gymId=${store.gymProfile._id}&date=${today}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setReports(data);
            } else {
                setReports([]);
            }
        } catch (e) {
            console.error("Error fetching reports", e);
            setReports([]);
        } finally {
            setLoadingReports(false);
        }
    };

    return (
        <div className="space-y-10 animate-fade-up">
            <DashboardHeader
                title="Gym"
                highlight="Attendance"
                subtitle="Track member check-ins"
                description="View who is currently in the gym."
            />

            <AttendanceStats />

            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                <div className="glass-premium p-2 mb-8 border-border w-max mx-auto md:mx-0">
                    <TabsList className="bg-transparent h-auto p-0 gap-2 flex">
                        <TabsTrigger 
                            value="mark"
                            className="h-10 px-6 rounded-lg text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Mark Attendance
                        </TabsTrigger>
                        <TabsTrigger 
                            value="reports"
                            className="h-10 px-6 rounded-lg text-[10px] font-black uppercase italic tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Daily Report
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="mark" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ManualEntry />
                        {canScan ? (
                            <AttendanceScanner />
                        ) : (
                            <div className="p-8 border-2 border-dashed rounded-xl bg-muted/30 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Lock className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg">Quick Scan Locked</h3>
                                    <p className="text-sm text-muted-foreground max-w-[250px]">
                                        QR Code scanning and automated check-ins are only available for Premium gyms.
                                    </p>
                                </div>
                                <Button className="bg-amber-500 hover:bg-amber-600 gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Upgrade to Premium
                                </Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                    <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Today's Activity</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    {/* Search & Filter HUD */}
                    <div className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-8 backdrop-blur-md">
                        <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
                            <Search className="w-3.5 h-3.5 text-primary/50" />
                            <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
                                Search
                            </span>
                        </div>

                        <div className="flex-1 w-full">
                            <InputField
                                hideLabel
                                validateType="text"
                                placeholder="Search check-ins by member name..."
                                value={search}
                                onChange={(val) => setSearch(val)}
                                leadingIcon={<Search className="w-4 h-4" />}
                                className="h-10 bg-transparent border-none hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase italic tracking-wider transition-all focus:border-none focus:ring-0"
                                containerClassName="w-full"
                            />
                        </div>
                    </div>
                
                    <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        <th className="text-left py-6 px-6 font-black text-slate-500 italic">Member</th>
                                        <th className="text-left py-6 px-6 font-black text-slate-500 italic">Check In</th>
                                        <th className="text-left py-6 px-6 font-black text-slate-500 italic">Check Out</th>
                                        <th className="text-left py-6 px-6 font-black text-slate-500 italic">Status</th>
                                        <th className="text-right py-6 px-6 font-black text-slate-500 italic">View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingReports ? (
                                        Array.from({ length: 8 }).map((_, i) => (
                                            <tr key={i} className="border-b border-white/5 animate-pulse">
                                                <td className="py-6 px-6">
                                                    <div className="h-4 w-32 bg-white/5 rounded" />
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="h-4 w-24 bg-white/5 rounded" />
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="h-4 w-24 bg-white/5 rounded" />
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="h-6 w-16 bg-white/5 rounded-lg" />
                                                </td>
                                                <td className="py-6 px-6">
                                                    <div className="flex justify-end">
                                                        <div className="h-8 w-8 bg-white/5 rounded-xl" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : reports.filter(r => `${r.memberId?.firstName || ""} ${r.memberId?.lastName || ""}`.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
                                        reports.filter(r => `${r.memberId?.firstName || ""} ${r.memberId?.lastName || ""}`.toLowerCase().includes(search.toLowerCase())).map((record: any) => {
                                            return (
                                                <tr key={record.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                                                    <td className="py-6 px-6 font-black italic text-foreground tracking-tighter">
                                                        {record.memberId?.firstName} {record.memberId?.lastName}
                                                    </td>
                                                    <td className="py-6 px-6 font-mono text-primary">
                                                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                                                    </td>
                                                    <td className="py-6 px-6 font-mono text-slate-500">
                                                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                                                    </td>
                                                    <td className="py-6 px-6">
                                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest border border-primary/20">
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-6 px-6 text-right">
                                                        <Link href={`/members/${record.memberId?.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-primary hover:border-primary/50 transition-all opacity-0 group-hover/row:opacity-100"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                                                No records found for today.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
