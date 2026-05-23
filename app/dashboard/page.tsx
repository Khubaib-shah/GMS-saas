"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, AlertCircle, DollarSign, CheckCircle, Dumbbell, Plus, Send } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart, AttendanceChart, MembershipStatusChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils/file-utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { getPreviousPeriod } from "@/lib/analytics-utils";

export default function DashboardPage() {
  const store = useAppStore();
  const { data: session } = useSession();
  // Only show skeletons if we have no data yet — mirrors gallery cache behaviour
  // On revisit: store already has data → false → renders instantly, no flash
  const [statsLoading, setStatsLoading] = useState(!store.dashboardStats);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const router = useRouter();
  const role = (session?.user as any)?.role;
  const isTrainer = role === 'trainer';

  useEffect(() => {
    const loadData = async () => {
      if (!store.gymProfile._id) return;

      setStatsLoading(true);

      let fetchFrom = dateRange?.from;
      if (dateRange?.from && dateRange?.to) {
        const prev = getPreviousPeriod({ from: dateRange.from, to: dateRange.to });
        fetchFrom = prev.from;
      }

      // Returns false if served from client TTL cache (data already in store)
      const didFetch = await store.loadDashboardStats({
        from: fetchFrom?.toISOString(),
        to: dateRange?.to?.toISOString() || new Date().toISOString()
      });
      // Only hide skeletons after a real fetch — if cached, skeletons were never shown
      if (didFetch) setStatsLoading(false);

    };

    if (store.gymProfile._id) {
      loadData();
    }
  }, [dateRange, store.gymProfile._id]);

  const {
    totalMembers = 0,
    currentNewMembers = 0,
    membersTrend,
    currentCheckins = 0,
    checkinsTrend,
    currentRevenue = 0,
    revenueTrend,
    expiringSoon = 0
  } = store.dashboardStats?.stats || {};
  
  const tables = store.dashboardStats?.tables || {};

  // ── Static shell renders immediately. Only values are skeleton'd ──────────
  return (
    <div className="space-y-4 md:space-y-10 animate-fade-up">
      {/* Header — always visible immediately */}
      <DashboardHeader
        title={isTrainer ? "Trainer" : "Admin"}
        highlight="Dashboard"
        subtitle={isTrainer ? "Track your performance" : "Overview of your gym"}
        description={isTrainer ? `Managing your members.` : 'See how your gym is doing today.'}
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

      {/* Stats Grid — card shell is instant, only the numbers skeleton */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatsCard
          title={dateRange?.from ? "New Members" : "Total Members"}
          value={currentNewMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={membersTrend}
          isLoading={statsLoading}
        />
        <StatsCard
          title={dateRange?.from ? "Period Check-ins" : "Total Check-ins"}
          value={currentCheckins.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={checkinsTrend}
          isLoading={statsLoading}
        />
        <StatsCard
          title="Expiring Plans"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          isLoading={statsLoading}
        />
        {!isTrainer && (
          <StatsCard
            title="Period Revenue"
            value={formatCurrency(currentRevenue)}
            icon={<DollarSign className="w-5 h-5" />}
            trend={revenueTrend}
            isLoading={statsLoading}
          />
        )}
      </div>

      {/* Charts Section — card shell is instant, inner chart is skeleton'd */}
      {!isTrainer && (
        <div className="space-y-4 md:space-y-8">
          <div data-tour="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-stretch">
            <div className="lg:col-span-2">
              <RevenueChart isLoading={statsLoading} dateRange={dateRange} />
            </div>
            <div className="h-full">
              <SubscriptionChart isLoading={statsLoading} dateRange={dateRange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-stretch">
            <div className="h-full">
              <MembershipStatusChart isLoading={statsLoading} />
            </div>
            <div className="h-full md:col-span-2">
              <AttendanceChart isLoading={statsLoading} dateRange={dateRange} />
            </div>
          </div>
        </div>
      )}

      {/* Members Table — shell renders immediately, rows populate as data loads */}
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
          <MembersTable trainerOnly={isTrainer} data={tables.recentMembers} isLoading={statsLoading} disableFetch={true} />
        </div>
      </div>

      {!isTrainer && (
        <div className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center md:gap-4 mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter text-red-500 uppercase">
              Expiring &amp; Expired
            </h2>
            <div className="hidden md:block h-px flex-1 bg-black/5 dark:bg-white/5"></div>
            <p className="text-[10px] font-medium md:font-black text-slate-500 uppercase tracking-widest -mt-1 md:mt-0">Memberships needing immediate renewal</p>
          </div>

          <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
            <MembersTable mode="expiring" data={tables.expiringMembers} isLoading={statsLoading} disableFetch={true} />
          </div>
        </div>
      )}
    </div>
  );
}
