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
import { DashboardHeader } from "@/components/dashboard-header";
import {
    BarChart, Bar,
    AreaChart, Area,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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
        <div className="space-y-8 animate-fade-in">
            <DashboardHeader
                title="PLATFORM"
                highlight="OVERVIEW"
                subtitle="Platform statistics and health"
                description="Overview of all gym performance."
                descriptionIconColor="emerald"
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {kpiCards.map((kpi) => (
                    <div
                        key={kpi.label}
                        className="group relative rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 hover:border-white/[0.12] transition-all duration-300 overflow-hidden"
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
                    <div className="h-[250px] w-full mt-4">
                        {(charts.registrationTrend || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">No registration data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.registrationTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="_id" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111118', borderColor: '#ffffff10', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        cursor={{ fill: '#ffffff05' }}
                                    />
                                    <Bar dataKey="count" name="Registrations" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">
                        Monthly Platform Revenue
                    </h3>
                    <div className="h-[250px] w-full mt-4">
                        {(charts.revenueTrend || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">No revenue data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={charts.revenueTrend} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="_id" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        stroke="#ffffff50" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false}
                                        tickFormatter={(value) => `₨ ${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111118', borderColor: '#ffffff10', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981' }}
                                        formatter={(value: number) => [formatPKR(value), "Revenue"]}
                                    />
                                    <Area type="monotone" dataKey="total" name="Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
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
                    <div className="h-[250px] w-full mt-4">
                        {(charts.planDistribution || []).length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-slate-500">No plans assigned yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <Pie
                                        data={charts.planDistribution}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {charts.planDistribution.map((entry: any, index: number) => {
                                            const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];
                                            return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                                        })}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111118', borderColor: '#ffffff10', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                                </PieChart>
                            </ResponsiveContainer>
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
