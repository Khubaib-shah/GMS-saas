"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    TrendingUp,
    AlertTriangle,
    DollarSign,
    Clock,
    ShieldAlert,
    Activity,
    Users,
} from "lucide-react";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

export default function SuperAdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/super-admin/dashboard")
            .then((r) => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[120px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    const kpis = data?.kpis || {};
    const charts = data?.charts || {};
    const recentActivity = data?.recentActivity || [];

    const kpiCards = [
        {
            label: "Total Gyms",
            value: kpis.totalGyms || 0,
            icon: Building2,
            color: "from-blue-500 to-cyan-500",
            bgColor: "bg-blue-500/10",
            textColor: "text-blue-400",
        },
        {
            label: "Active Gyms",
            value: kpis.activeGyms || 0,
            icon: Activity,
            color: "from-emerald-500 to-green-500",
            bgColor: "bg-emerald-500/10",
            textColor: "text-emerald-400",
        },
        {
            label: "Suspended",
            value: kpis.suspendedGyms || 0,
            icon: ShieldAlert,
            color: "from-red-500 to-rose-500",
            bgColor: "bg-red-500/10",
            textColor: "text-red-400",
        },
        {
            label: "On Trial",
            value: kpis.trialGyms || 0,
            icon: Clock,
            color: "from-amber-500 to-yellow-500",
            bgColor: "bg-amber-500/10",
            textColor: "text-amber-400",
        },
        {
            label: "Total Revenue",
            value: formatPKR(kpis.totalRevenuePKR || 0),
            icon: DollarSign,
            color: "from-indigo-500 to-purple-500",
            bgColor: "bg-indigo-500/10",
            textColor: "text-indigo-400",
            isLarge: true,
        },
        {
            label: "Monthly Revenue",
            value: formatPKR(kpis.monthlyRevenuePKR || 0),
            icon: TrendingUp,
            color: "from-violet-500 to-purple-500",
            bgColor: "bg-violet-500/10",
            textColor: "text-violet-400",
            isLarge: true,
        },
        {
            label: "Expiring (7 days)",
            value: kpis.upcomingExpiries || 0,
            icon: AlertTriangle,
            color: "from-orange-500 to-amber-500",
            bgColor: "bg-orange-500/10",
            textColor: "text-orange-400",
        },
        {
            label: "Expired",
            value: kpis.expiredGyms || 0,
            icon: ShieldAlert,
            color: "from-rose-500 to-pink-500",
            bgColor: "bg-rose-500/10",
            textColor: "text-rose-400",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Platform Overview
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Monitor all gyms, revenue, and platform health
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {kpiCards.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="group relative rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 hover:border-white/[0.12] transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    {kpi.label}
                                </p>
                                <p className={`text-2xl font-bold mt-2 ${kpi.textColor}`}>
                                    {kpi.value}
                                </p>
                            </div>
                            <div
                                className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}
                            >
                                <kpi.icon className={`w-5 h-5 ${kpi.textColor}`} />
                            </div>
                        </div>
                        {/* Gradient accent line */}
                        <div
                            className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl`}
                        />
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Trend */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Monthly Gym Registrations
                    </h3>
                    <div className="space-y-3">
                        {(charts.registrationTrend || []).length === 0 ? (
                            <p className="text-xs text-slate-500">No registration data yet</p>
                        ) : (
                            charts.registrationTrend.map((item: any) => (
                                <div key={item._id} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 w-20 shrink-0">
                                        {item._id}
                                    </span>
                                    <div className="flex-1 h-6 bg-white/[0.03] rounded-md overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (item.count /
                                                        Math.max(
                                                            ...charts.registrationTrend.map(
                                                                (t: any) => t.count
                                                            )
                                                        )) *
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-white w-8 text-right">
                                        {item.count}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Monthly Platform Revenue
                    </h3>
                    <div className="space-y-3">
                        {(charts.revenueTrend || []).length === 0 ? (
                            <p className="text-xs text-slate-500">No revenue data yet</p>
                        ) : (
                            charts.revenueTrend.map((item: any) => (
                                <div key={item._id} className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 w-20 shrink-0">
                                        {item._id}
                                    </span>
                                    <div className="flex-1 h-6 bg-white/[0.03] rounded-md overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-md transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    100,
                                                    (item.total /
                                                        Math.max(
                                                            ...charts.revenueTrend.map(
                                                                (t: any) => t.total
                                                            )
                                                        )) *
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-400 w-24 text-right">
                                        {formatPKR(item.total)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Plan Distribution + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Plan Distribution
                    </h3>
                    <div className="space-y-3">
                        {(charts.planDistribution || []).length === 0 ? (
                            <p className="text-xs text-slate-500">No plans assigned yet</p>
                        ) : (
                            charts.planDistribution.map((p: any, i: number) => {
                                const colors = [
                                    "bg-indigo-500",
                                    "bg-emerald-500",
                                    "bg-amber-500",
                                    "bg-rose-500",
                                    "bg-violet-500",
                                ];
                                return (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-3 h-3 rounded-full ${colors[i % colors.length]
                                                    }`}
                                            />
                                            <span className="text-sm text-slate-300">
                                                {p.name}
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-white">
                                            {p.count}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {recentActivity.length === 0 ? (
                            <p className="text-xs text-slate-500">No recent activity</p>
                        ) : (
                            recentActivity.map((a: any) => (
                                <div
                                    key={a.id}
                                    className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">
                                                Payment from {a.gymName}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                                {new Date(a.date).toLocaleDateString("en-PK")}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-emerald-400">
                                        {formatPKR(a.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
