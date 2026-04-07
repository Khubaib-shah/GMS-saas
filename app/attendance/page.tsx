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
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function AttendancePage() {
    const { data: session } = useSession();
    const isPremium = (session?.user as any)?.isPremium;
    const store = useAppStore();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await store.loadMembers();
            setLoading(false);
        };
        loadData();
    }, []);

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
        <div className="container mx-auto space-y-8 animate-fade-in">
            <DashboardHeader
                title="ATTENDANCE"
                highlight="TRACKING"
                subtitle="SYSTEM: ATTENDANCE_v1"
                description="Manage daily check-ins and view reports."
                descriptionIconColor="emerald"
            />

            <AttendanceStats />

            <Tabs defaultValue="mark" className="w-full" onValueChange={(val) => {
                if (val === 'reports') fetchReports();
            }}>
                <TabsList className="mb-4">
                    <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                    <TabsTrigger value="reports">Daily Report</TabsTrigger>
                </TabsList>

                <TabsContent value="mark" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <ManualEntry />
                        {isPremium ? (
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

                <TabsContent value="reports">
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Check In</TableHead>
                                        <TableHead>Check Out</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingReports ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                Loading reports...
                                            </TableCell>
                                        </TableRow>
                                    ) : reports.length > 0 ? (
                                        reports.map((record: any) => (
                                            <TableRow key={record.id} className="capitalize">
                                                <TableCell className="font-medium">
                                                    {record.memberId?.firstName} {record.memberId?.lastName}
                                                </TableCell>
                                                <TableCell>
                                                    {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="capitalize">{record.status}</span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                                No records found for today.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
