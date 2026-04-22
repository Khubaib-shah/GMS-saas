"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, AlertCircle, DollarSign, CheckCircle, UserPlus, Zap, Dumbbell, Plus, Send } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart, AttendanceChart, MembershipStatusChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, daysUntilExpiry, formatCurrency } from "@/lib/utils/file-utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

export default function DashboardPage() {
  const store = useAppStore();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      await Promise.all([
        store.loadMembers(),
        store.loadSubscriptions(),
        store.loadPayments(),
        store.loadAttendance({ date: today })
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isTrainer = role === 'trainer';

  const members = Array.isArray(store.members) ? store.members : [];
  const subscriptions = Array.isArray(store.subscriptions) ? store.subscriptions : [];
  const payments = Array.isArray(store.payments) ? store.payments : [];
  const attendance = Array.isArray(store.attendance) ? store.attendance : [];

  // Filter data for trainer
  const myMembers = isTrainer
    ? members.filter(m => (m as any).trainerId === userId || (m as any).trainerId?._id === userId)
    : members;

  const totalMembers = myMembers.length;

  const activeSubscriptions = isTrainer
    ? myMembers.filter(m => (m as any).activeSubscription && isSubscriptionActive((m as any).activeSubscription.endDate, (m as any).activeSubscription.status)).length
    : subscriptions.filter(s => isSubscriptionActive(s.endDate, s.status)).length;

  const todayCheckins = attendance.length; // Already filtered by trainer in the API if role is trainer

  const monthlyRevenue = isTrainer ? 0 : payments
    .filter((p) => {
      const paymentDate = new Date(p.date);
      const now = new Date();
      return (
        paymentDate.getFullYear() === now.getFullYear() &&
        paymentDate.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const expiringSoon = isTrainer
    ? myMembers.filter(m => {
      const active = (m as any).activeSubscription;
      if (!active || active.status === "paused") return false;
      const daysLeft = daysUntilExpiry(active.endDate);
      return daysLeft > 0 && daysLeft <= 7;
    }).length
    : subscriptions.filter((s) => {
      if (s.status === "paused") return false;
      const daysLeft = daysUntilExpiry(s.endDate);
      return daysLeft > 0 && daysLeft <= 7;
    }).length;



  return (
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title={isTrainer ? "Trainer" : "Admin"}
        highlight="Dashboard"
        subtitle={isTrainer ? "Track your performance" : "Overview of your gym"}
        description={isTrainer ? `Managing ${totalMembers} members.` : 'See how your gym is doing today.'}
        descriptionIconColor={isTrainer ? "emerald" : "primary"}
      >
        <div className="flex flex-wrap items-center gap-3">
          {!isTrainer && (
            <DateRangePicker
              date={dateRange}
              onDateChange={setDateRange}
              placeholder="Filter by date range"
            />
          )}
          {isTrainer && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push('/trainer/exercises')}
                className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black italic tracking-tighter transition-all"
              >
                <Dumbbell className="mr-2 w-4 h-4" />
                Exercises
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/trainer/templates')}
                className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black italic tracking-tighter transition-all"
              >
                <Plus className="mr-2 w-4 h-4" />
                Templates
              </Button>
              <Button
                onClick={() => router.push('/trainer/deploy')}
                className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95"
              >
                <Send className="mr-2 w-4 h-4" />
                Assign Plan
              </Button>
            </>
          )}
        </div>
      </DashboardHeader>

      {/* Stats Grid */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={isTrainer ? "Total Members" : "Total Members"}
          value={totalMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={isTrainer ? undefined : { value: 5, isPositive: true }}
          isLoading={loading}
        />
        <StatsCard
          title={isTrainer ? "Daily Check-ins" : "Daily Check-ins"}
          value={todayCheckins.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={isTrainer ? undefined : { value: 2, isPositive: true }}
          isLoading={loading}
        />
        <StatsCard
          title="Expiring Plans"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={expiringSoon > 0 ? { value: 8, isPositive: false } : undefined}
          isLoading={loading}
        />
        {!isTrainer && (
          <StatsCard
            title="Monthly Revenue"
            value={`${formatCurrency(monthlyRevenue).replace("PKR", "")}`}
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
            isLoading={loading}
          />
        )}
        {isTrainer && (
          <StatsCard
            title="Active Clients"
            value={activeSubscriptions.toString()}
            icon={<TrendingUp className="w-5 h-5" />}
            isLoading={loading}
          />
        )}
      </div>

      {/* Charts Section - Only for Managers/Owners */}
      {!isTrainer && (
        <div className="space-y-8">
          <div data-tour="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2">
              <RevenueChart isLoading={loading} dateRange={dateRange} />
            </div>
            <div className="h-full">
              <SubscriptionChart isLoading={loading} dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            <div className="h-full">
              <MembershipStatusChart isLoading={loading} />
            </div>
            <div className="h-full md:col-span-2">
              <AttendanceChart isLoading={loading} dateRange={dateRange} />
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div data-tour="dashboard-members" className="relative">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
            {isTrainer ? 'My Members' : 'Recent Members'}
          </h2>
          <div className="h-px flex-1 bg-black/5 dark:bg-white/5 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]"></div>
            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-primary/10 rounded-full"></div>
          </div>
        </div>
        <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
          <MembersTable trainerOnly={isTrainer} />
        </div>
      </div>

      {!isTrainer && (
        <div className="relative">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black italic tracking-tighter text-red-500 uppercase">
              Expiring & Expired
            </h2>
            <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Memberships needing immediate renewal</p>
          </div>

          <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
            <MembersTable mode="expiring" />
          </div>
        </div>
      )}
    </div>
  );
}
