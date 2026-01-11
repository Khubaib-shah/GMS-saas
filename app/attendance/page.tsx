"use client";

import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualEntry } from "@/components/attendance/manual-entry";
import { AttendanceScanner } from "@/components/attendance/attendance-scanner";
import { AttendanceStats } from "@/components/attendance/attendance-stats";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AttendancePage() {
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
         } catch(e) {
             console.error("Error fetching reports", e);
             setReports([]);
         } finally {
             setLoadingReports(false);
         }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Loading attendance data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-8 animate-fade-in">
             <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Attendance</h1>
                <p className="text-muted-foreground">Manage daily check-ins and view reports.</p>
            </div>

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
                        <AttendanceScanner />
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
