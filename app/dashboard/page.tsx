"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, AlertCircle, DollarSign, CheckCircle, UserPlus, Zap, Dumbbell, Plus, Send } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { RevenueChart, SubscriptionChart } from "@/components/dashboard-charts";
import { MembersTable } from "@/components/members-table";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, daysUntilExpiry, formatCurrency } from "@/lib/utils/file-utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardPage() {
  const store = useAppStore();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);

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
        {isTrainer && (
          <div className="flex flex-wrap items-center gap-3">
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
          </div>
        )}
      </DashboardHeader>

      {/* Stats Grid */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={isTrainer ? "Total Members" : "Total Members"}
          value={totalMembers.toString()}
          icon={<Users className="w-5 h-5" />}
          trend={isTrainer ? undefined : { value: 5, isPositive: true }}
        />
        <StatsCard
          title={isTrainer ? "Daily Check-ins" : "Daily Check-ins"}
          value={todayCheckins.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          trend={isTrainer ? undefined : { value: 2, isPositive: true }}
        />
        <StatsCard
          title="Expiring Plans"
          value={expiringSoon.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={expiringSoon > 0 ? { value: 8, isPositive: false } : undefined}
        />
        {!isTrainer && (
          <StatsCard
            title="Monthly Revenue"
            value={`₨ ${formatCurrency(monthlyRevenue).replace("PKR", "")}`}
            icon={<DollarSign className="w-5 h-5" />}
            trend={{ value: 12, isPositive: true }}
          />
        )}
        {isTrainer && (
          <StatsCard
            title="Active Clients"
            value={activeSubscriptions.toString()}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        )}
      </div>

      {/* Charts Section - Only for Managers/Owners */}
      {!isTrainer && (
        <div data-tour="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div className="">
            <SubscriptionChart />
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
              Expiring Memberships
            </h2>
            <div className="h-px flex-1 bg-black/5 dark:bg-white/5"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Expiring in the next 7 days</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions
              .filter(s => {
                const days = daysUntilExpiry(s.endDate);
                return s.status === "active" && days > 0 && days <= 7;
              })
              .sort((a, b) => daysUntilExpiry(a.endDate) - daysUntilExpiry(b.endDate))
              .map(sub => {
                const member = members.find(m => m.id === sub.memberId);
                if (!member) return null;
                const days = daysUntilExpiry(sub.endDate);
                
                return (
                  <div key={sub.id} className="glass-premium p-6 border-l-4 border-l-red-500 hover:scale-[1.02] transition-all cursor-pointer group/card active:scale-[0.98]" onClick={() => router.push(`/members/${member.id}`)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover/card:bg-red-500/20 transition-colors">
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                          <p className="font-black uppercase italic text-base tracking-tighter group-hover/card:text-red-500 transition-colors">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase italic mt-1">Expires in {days} Days</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white/5">
                        <Plus className="w-4 h-4 rotate-45 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            {subscriptions.filter(s => {
              const days = daysUntilExpiry(s.endDate);
              return s.status === "active" && days > 0 && days <= 7;
            }).length === 0 && (
              <div className="col-span-full py-10 text-center glass-premium border-dashed opacity-50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic underline underline-offset-4">No memberships expiring in the next 7 days.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
