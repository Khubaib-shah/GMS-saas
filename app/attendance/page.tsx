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
    const canManual = store.gymProfile?.enabledFeatures?.includes("manualAttendance");
    const canScan = store.gymProfile?.enabledFeatures?.includes("qrAttendance");
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
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



    const fetchReports = async () => {
        if (!store.gymProfile?._id) return;
        setLoadingReports(true);
        try {
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
        <div className="space-y-4 md:space-y-10 animate-fade-up">
            <DashboardHeader
                title="Gym"
                highlight="Attendance"
                subtitle="Track member check-ins"
                description="View who is currently in the gym."
            />

            <AttendanceStats />

            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                <div className="glass-premium p-2 mb-8 border-border w-full md:w-max mx-auto md:mx-0">
                    <TabsList className="bg-transparent h-auto p-0 gap-2 flex">
                        <TabsTrigger
                            value="mark"
                            className="h-10 px-6 rounded-lg text-[10px] font-normal md:font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                        >
                            Mark Attendance
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="h-10 px-6 rounded-lg text-[10px] font-normal md:font-black uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
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
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Today's Activity</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    {/* Search & Filter HUD */}


                    <div className="glass-premium p-6 border-border bg-card dark:bg-slate-950/40 rounded-3xl">
                            <DataTable
                                isLoading={loadingReports}
                                columns={columns}
                                searchKey="memberName"
                                searchPlaceholder="Search check-ins by member name..."
                                data={reports.map((record: any) => ({
                                    id: record.id,
                                    memberName: `${record.memberId?.firstName || ""} ${record.memberId?.lastName || ""}`,
                                    memberId: record.memberId?.id,
                                    checkInTime: record.checkInTime,
                                    checkOutTime: record.checkOutTime,
                                    status: record.status
                                }))}
                            />

                        {reports.length === 0 && !loadingReports && (
                            <div className="text-center py-24 bg-white/[0.01]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
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
