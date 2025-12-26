"use client";

import { useEffect } from "react";
import { Users, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, daysUntilExpiry, formatCurrency } from "@/lib/utils/file-utils";

export default function DashboardPage() {
  const store = useAppStore();

  useEffect(() => {
    store.loadMembers();
    store.loadSubscriptions();
    store.loadPayments();
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your gym overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Members"
          value={totalMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Subscriptions"
          value={activeSubscriptions.toString()}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Expiring Soon"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={{ value: expiringSoon > 0 ? 8 : 0, isPositive: false }}
        />
        <StatsCard
          title="Revenue This Month"
          value={formatCurrency(monthlyRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueChart />
        <SubscriptionChart />
      </div>

      {/* Members Table */}
      <div>
         <h2 className="text-xl font-bold mb-4 tracking-tight">Recent Members</h2>
         <MembersTable />
      </div>
    </div>
  );
}
