"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock } from "lucide-react";

export function AttendanceStats() {
  const store = useAppStore();
  const [stats, setStats] = useState({
    present: 0,
    activeMembers: 0,
    checkInsToday: 0
  });

  const fetchStats = async () => {

    if (!store.gymProfile?._id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance/report?gymId=${store.gymProfile._id}&date=${today}`);
      const data = await res.json();
      // im getting [] empty array even thou i have checked in 

      if (Array.isArray(data)) {
        setStats({
          present: data.filter(d => d.status === 'present').length,
          activeMembers: store.members.length,
          checkInsToday: data.length
        });
      }
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  useEffect(() => {
    if (store.gymProfile?._id) {
      fetchStats();
    }
    // Poll every 30s to update live stats
    const interval = setInterval(() => {
      if (store.gymProfile?._id) fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [store.gymProfile?._id, store.members.length]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="glass-premium">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.checkInsToday}</div>
          <p className="text-xs text-muted-foreground">
            Members present now
          </p>
        </CardContent>
      </Card>
      {/* Add more stats as needed */}
    </div>
  );
}
