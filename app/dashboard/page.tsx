"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, daysUntilExpiry, formatCurrency } from "@/lib/utils/file-utils";

export default function DashboardPage() {
  const store = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        store.loadMembers(),
        store.loadSubscriptions(),
        store.loadPayments()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const members = Array.isArray(store.members) ? store.members : [];
  const subscriptions = Array.isArray(store.subscriptions) ? store.subscriptions : [];
  const payments = Array.isArray(store.payments) ? store.payments : [];

  const totalMembers = members.length;
  const activeSubscriptions = subscriptions.filter((s) =>
    isSubscriptionActive(s.endDate, s.status)
  ).length;

  const expiringSoon = subscriptions.filter((s) => {
    if (s.status === "paused") return false;
    const daysLeft = daysUntilExpiry(s.endDate);
    return daysLeft > 0 && daysLeft <= 7;
  }).length;

  const monthlyRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return (
        paymentDate.getFullYear() === now.getFullYear() &&
        paymentDate.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-10 animate-fade-up">
      {/* HUD HEADER */}
      <div className="relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">SYSTEM_OVERVIEW: DASHBOARD_v2</span>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
          COMMAND <span className="text-primary neon-text">CENTER</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          All systems operational. Tactical intake active.
        </p>
      </div>

      {/* Stats Grid */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="TOTAL_BEASTS"
          value={totalMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="ACTIVE_NODES"
          value={activeSubscriptions.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="DECAYING_SLOTS"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={{ value: expiringSoon > 0 ? 8 : 0, isPositive: false }}
        />
        <StatsCard
          title="MONTHLY_THROUGHPUT"
          value={formatCurrency(monthlyRevenue).replace("PKR", "")}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div data-tour="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="">
          <SubscriptionChart />
        </div>
      </div>

      {/* Members Table */}
      <div data-tour="dashboard-members" className="relative">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">RECENT_DEPLOYMENTS</h2>
          <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-primary"></div>
            <div className="w-1 h-1 bg-primary/50"></div>
            <div className="w-1 h-1 bg-primary/20"></div>
          </div>
        </div>
        <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
          <MembersTable />
        </div>
      </div>
    </div>
  );
}
