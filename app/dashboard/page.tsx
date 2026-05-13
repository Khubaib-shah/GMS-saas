"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, AlertCircle, DollarSign, CheckCircle, UserPlus, Zap, Dumbbell, Plus, Send } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart, AttendanceChart, MembershipStatusChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { daysUntilExpiry, formatCurrency } from "@/lib/utils/file-utils";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { getPreviousPeriod, calculateTrend, isDateInRange } from "@/lib/analytics-utils";
import { 
  StatsCardSkeleton, 
  ChartCardSkeleton, 
  TableSkeleton, 
  PageHeaderSkeleton 
} from "@/components/ui/skeleton-components";

export default function DashboardPage() {
  const store = useAppStore();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Set default date range on mount to avoid hydration mismatch
  useEffect(() => {
    if (!dateRange) {
      setDateRange({
        from: subDays(new Date(), 30),
        to: new Date()
      });
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      if (!dateRange || !store.gymProfile._id) return;

      setLoading(true);

      let fetchFrom = dateRange?.from;
      if (dateRange?.from && dateRange?.to) {
        const prev = getPreviousPeriod({ from: dateRange.from, to: dateRange.to });
        fetchFrom = prev.from;
      }

      await Promise.all([
        store.loadMembers(),
        store.loadPlans(),
        store.loadSubscriptions(),
        store.loadPayments(),
        store.loadAttendance({
          from: fetchFrom?.toISOString(),
          to: dateRange?.to?.toISOString() || new Date().toISOString()
        })
      ]);
      setLoading(false);
    };
    if (store.gymProfile._id) {
      loadData();
    }
  }, [dateRange, store.gymProfile._id]);

  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isTrainer = role === 'trainer';

  const { totalMembers, currentNewMembers, membersTrend, currentCheckins, checkinsTrend, currentRevenue, revenueTrend, expiringSoon } = useMemo(() => {
    const members = Array.isArray(store.members) ? store.members : [];
    const subscriptions = Array.isArray(store.subscriptions) ? store.subscriptions : [];
    const payments = Array.isArray(store.payments) ? store.payments : [];
    const attendance = Array.isArray(store.attendance) ? store.attendance : [];

    const myMembers = isTrainer
      ? members.filter(m => (m as any).trainerId === userId || (m as any).trainerId?._id === userId)
      : members;

    const totalMembers = myMembers.length;
    const prevRange = dateRange?.from && dateRange?.to ? getPreviousPeriod({ from: dateRange.from, to: dateRange.to }) : null;

    // 1. Members Trend
    const currentNewMembers = dateRange?.from && dateRange?.to
      ? myMembers.filter(m => m.joinDate && isDateInRange(m.joinDate, { from: dateRange.from!, to: dateRange.to! })).length
      : totalMembers;
    const prevNewMembers = prevRange
      ? myMembers.filter(m => m.joinDate && isDateInRange(m.joinDate, prevRange)).length
      : 0;
    const membersTrend = prevRange ? calculateTrend(currentNewMembers, prevNewMembers) : undefined;

    // 2. Check-ins Trend
    const currentCheckins = dateRange?.from && dateRange?.to
      ? attendance.filter(a => isDateInRange(a.date, { from: dateRange.from!, to: dateRange.to! })).length
      : attendance.length;
    const prevCheckins = prevRange
      ? attendance.filter(a => isDateInRange(a.date, prevRange)).length
      : 0;
    const checkinsTrend = prevRange ? calculateTrend(currentCheckins, prevCheckins) : undefined;

    // 3. Revenue Trend
    const currentRevenue = dateRange?.from && dateRange?.to
      ? payments.filter(p => isDateInRange(p.date, { from: dateRange.from!, to: dateRange.to! })).reduce((sum, p) => sum + p.amount, 0)
      : payments.reduce((sum, p) => sum + p.amount, 0);
    const prevRevenue = prevRange
      ? payments.filter(p => isDateInRange(p.date, prevRange)).reduce((sum, p) => sum + p.amount, 0)
      : 0;
    const revenueTrend = prevRange ? calculateTrend(currentRevenue, prevRevenue) : undefined;

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

    return { totalMembers, currentNewMembers, membersTrend, currentCheckins, checkinsTrend, currentRevenue, revenueTrend, expiringSoon };
  }, [store.members, store.subscriptions, store.payments, store.attendance, isTrainer, userId, dateRange]);



  if (loading || !dateRange) {
    return (
      <div className="space-y-4 md:space-y-10 animate-pulse">
        <PageHeaderSkeleton showButton={false} />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-10">
          <div className="h-[300px]">
             <ChartCardSkeleton type="bar" />
          </div>
          <div className="h-[300px]">
             <ChartCardSkeleton type="bar" />
          </div>
          <div className="h-[300px]">
             <ChartCardSkeleton type="pie" />
          </div>
          <div className="h-[300px]">
             <ChartCardSkeleton type="pie" />
          </div>
        </div>

        <div className="mt-4 md:mt-10">
          <TableSkeleton columns={5} rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-10 animate-fade-up">
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
                className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black tracking-tighter transition-all"
              >
                <Dumbbell className="mr-2 w-4 h-4" />
                Exercises
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/trainer/templates')}
                className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black tracking-tighter transition-all"
              >
                <Plus className="mr-2 w-4 h-4" />
                Templates
              </Button>
              <Button
                onClick={() => router.push('/trainer/deploy')}
                className="h-12 px-6 rounded-xl bg-primary text-black hover:bg-white font-black tracking-tighter shadow-lg transition-all active:scale-95"
              >
                <Send className="mr-2 w-4 h-4" />
                Assign Plan
              </Button>
            </>
          )}
        </div>
      </DashboardHeader>

      {/* Stats Grid */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard
          title={dateRange?.from ? "New Members" : "Total Members"}
          // value={totalMembers.toString()}
          value={currentNewMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={membersTrend}
          isLoading={loading}
        />
        <StatsCard
          title={dateRange?.from ? "Period Check-ins" : "Total Check-ins"}
          value={currentCheckins.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={checkinsTrend}
          isLoading={loading}
        />
        <StatsCard
          title="Expiring Plans"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          isLoading={loading}
        />
        {!isTrainer && (
          <StatsCard
            title="Period Revenue"
            value={formatCurrency(currentRevenue)}
            icon={<DollarSign className="w-5 h-5" />}
            trend={revenueTrend}
            isLoading={loading}
          />
        )}
      </div>

      {/* Charts Section - Only for Managers/Owners */}
      {!isTrainer && (
        <div className="space-y-4 md:space-y-8">
          <div data-tour="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-stretch">
            <div className="lg:col-span-2">
              <RevenueChart isLoading={loading} dateRange={dateRange} />
            </div>
            <div className="h-full">
              <SubscriptionChart isLoading={loading} dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-stretch">
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
        <div className="flex items-center gap-4 mb-4 md:mb-8">
          <h2 className="text-xl md:text-2xl font-black tracking-tighter text-foreground uppercase">
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
          <div className="flex flex-col md:flex-row items-start md:items-center md:gap-4 mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter text-red-500 uppercase">
              Expiring & Expired
            </h2>
            <div className="hidden md:block h-px flex-1 bg-black/5 dark:bg-white/5"></div>
            <p className="text-[10px] font-medium md:font-black text-slate-500 uppercase tracking-widest -mt-1 md:mt-0">Memberships needing immediate renewal</p>
          </div>

          <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
            <MembersTable mode="expiring" />
          </div>
        </div>
      )}
    </div>
  );
}
