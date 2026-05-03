"use client";

import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntry } from "@/components/attendance/manual-entry";
import { AttendanceScanner } from "@/components/attendance/attendance-scanner";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { DashboardHeader } from "@/components/dashboard-header";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Lock, Search } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { WhatsAppUpgradeButton } from "@/components/ui/whatsapp-upgrade-button";
import { FeatureLock } from "@/components/ui/feature-lock";
import { Skeleton } from "@/components/ui/skeleton";

export default function AttendancePage() {
    const store = useAppStore();
    const { data: session } = useSession();
    const isPremium = (session?.user as any)?.isPremium;
    const canManual = store.gymProfile?.enabledFeatures?.includes("manualAttendance") || store.gymProfile?.enabledFeatures?.includes("attendance");
    const canScan = store.gymProfile?.enabledFeatures?.includes("qrAttendance") || store.gymProfile?.enabledFeatures?.includes("attendance");
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

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

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

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

    const filteredReports = useMemo(() => {
        return reports.filter(r =>
            `${r.memberId?.firstName || ""} ${r.memberId?.lastName || ""}`.toLowerCase().includes(search.toLowerCase())
        );
    }, [reports, search]);

    const paginatedReports = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredReports.slice(start, start + pageSize);
    }, [filteredReports, currentPage]);

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
                        {loading ? (
                            <>
                                <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />
                                <Skeleton className="h-[400px] w-full rounded-xl bg-white/5" />
                            </>
                        ) : (
                            <>
                                {canManual ? (
                                    <ManualEntry />
                                ) : (
                                    <FeatureLock
                                        title="Manual Entry Locked"
                                        description="Manual check-ins are currently disabled for your gym instance. Upgrade your plan to enable this feature."
                                    />
                                )}
                                {canScan ? (
                                    <AttendanceScanner />
                                ) : (
                                    <FeatureLock
                                        title="Quick Scan Locked"
                                        description="QR Code scanning and automated check-ins are only available for Premium gyms."
                                    />
                                )}
                            </>
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

                    <div className="glass-premium p-6 border-border bg-card dark:bg-slate-950/40 rounded-3xl">
                        {loadingReports ? (
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredReports.map((record: any) => ({
                                    id: record.id,
                                    memberName: `${record.memberId?.firstName || ""} ${record.memberId?.lastName || ""}`,
                                    memberId: record.memberId?.id,
                                    checkInTime: record.checkInTime,
                                    checkOutTime: record.checkOutTime,
                                    status: record.status
                                }))}
                                searchKey="memberName"
                                searchPlaceholder="Filter by member name..."
                            />
                        )}

                        {filteredReports.length === 0 && !loadingReports && (
                            <div className="text-center py-24 bg-white/[0.01]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                                    No records found for today.
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
