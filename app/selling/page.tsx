"use client";

import { useState, useEffect, useCallback } from "react";
import {
    ShoppingBag, Plus, ArrowUpRight, Package, AlertTriangle,
    TrendingUp, BarChart3, Layers, Tag, Key, History, Loader2,
    ClipboardList, Clock, RefreshCcw, Banknote, Smartphone,
    CreditCard, Zap, TrendingDown, CircleDollarSign, Boxes,
    CheckCircle2, XCircle, ChevronRight, Star, ShoppingCart,
    Activity, Users,
} from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { FeatureGate } from "@/components/ui/feature-gate";

// ── Color Palette ─────────────────────────────────────────────────────────────
const ORANGE = "#FF6B35";
const EMERALD = "#10b981";
const BLUE = "#3b82f6";
const PURPLE = "#a855f7";
const AMBER = "#f59e0b";
const ROSE = "#f43f5e";

const SOURCE_COLORS: Record<string, string> = {
    pos: EMERALD,
    memberPortal: ORANGE,
    externalApi: BLUE,
};

const PAYMENT_COLORS: Record<string, string> = {
    cash: EMERALD,
    card: BLUE,
    online: PURPLE,
    memberCredit: ORANGE,
    other: "#6b7280",
};

const CATEGORY_COLORS = [ORANGE, EMERALD, BLUE, PURPLE, AMBER, ROSE, "#14b8a6", "#8b5cf6"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString();
const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
const fmtDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

// ── Custom Recharts Tooltip ────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl border border-white/10 p-3 text-xs shadow-2xl" style={{ background: "#0f1117" }}>
            <p className="font-black uppercase tracking-widest text-slate-400 mb-2">{fmtDate(label)}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-slate-400 capitalize">{p.name}:</span>
                    <span className="font-black text-white">
                        {p.dataKey === "revenue" ? `PKR ${fmt(p.value)}` : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 p-2.5 text-xs shadow-2xl" style={{ background: "#0f1117" }}>
            <p className="font-black text-white">{payload[0].name}</p>
            <p className="text-slate-400">PKR {fmt(payload[0].value)}</p>
        </div>
    );
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
    label, value, sub, icon: Icon, color, trend, href, loading
}: {
    label: string; value: string; sub?: string; icon: any;
    color: string; trend?: string; href?: string; loading?: boolean;
}) {
    const isPositive = trend ? !trend.startsWith("-") : true;
    const content = (
        <div
            className="rounded-2xl border p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-white/15 cursor-default"
            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)", borderColor: "rgba(255,255,255,0.06)" }}
        >
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-6 translate-x-6"
                style={{ background: color, filter: "blur(20px)" }} />
            <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${color}18` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </div>
                )}
                {href && <ChevronRight className="w-4 h-4 text-slate-600" />}
            </div>
            {loading ? (
                <div className="h-8 w-24 rounded-lg bg-white/5 animate-pulse" />
            ) : (
                <div>
                    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                    {sub && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{sub}</p>}
                </div>
            )}
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        </div>
    );
    return href ? <Link href={href}>{content}</Link> : content;
}

// ── Client-side Cache ─────────────────────────────────────────────────────────
const CLIENT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getClientCache(key: string): any | null {
    try {
        const raw = sessionStorage.getItem(`selling_dashboard:${key}`);
        if (!raw) return null;
        const { data, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) {
            sessionStorage.removeItem(`selling_dashboard:${key}`);
            return null;
        }
        return data;
    } catch { return null; }
}

function setClientCache(key: string, data: any): void {
    try {
        sessionStorage.setItem(`selling_dashboard:${key}`, JSON.stringify({
            data,
            expiresAt: Date.now() + CLIENT_CACHE_TTL,
        }));
    } catch { /* sessionStorage unavailable */ }
}

function clearClientCache(key: string): void {
    try { sessionStorage.removeItem(`selling_dashboard:${key}`); } catch { }
}

// ── Period Selector ───────────────────────────────────────────────────────────
const PERIODS = [
    { key: "today", label: "Today" },
    { key: "week", label: "7 Days" },
    { key: "month", label: "30 Days" },
    { key: "all", label: "All Time" },
] as const;

type Period = typeof PERIODS[number]["key"];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SellingDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>("month");
    const [cacheAge, setCacheAge] = useState<string | null>(null);

    const fetchStats = useCallback(async (p: Period, forceRefresh = false) => {
        // 1. Try client cache first
        if (!forceRefresh) {
            const cached = getClientCache(p);
            if (cached) {
                setData(cached);
                setLoading(false);
                const ageMs = Date.now() - new Date(cached.cachedAt).getTime();
                setCacheAge(`${Math.round(ageMs / 1000)}s ago`);
                return;
            }
        }

        setLoading(true);
        setCacheAge(null);
        try {
            const url = forceRefresh
                ? `/api/selling/dashboard?period=${p}&refresh=1`
                : `/api/selling/dashboard?period=${p}`;
            const res = await fetch(url);
            const json = await res.json();
            if (!json.error) {
                setData(json);
                setClientCache(p, json);
                setCacheAge(null); // fresh data
            }
        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleRefresh = useCallback(() => {
        clearClientCache(period);
        fetchStats(period, true);
    }, [period, fetchStats]);

    useEffect(() => { fetchStats(period); }, [period, fetchStats]);

    // ── Derived Data ─────────────────────────────────────────────────────────
    const sourceData = data ? [
        { name: "POS", value: data.revenueBySource.pos },
        { name: "Member Portal", value: data.revenueBySource.memberPortal },
        { name: "External API", value: data.revenueBySource.externalApi },
    ].filter(d => d.value > 0) : [];

    const paymentData = data ? [
        { name: "Cash", value: data.revenueByPaymentMethod.cash },
        { name: "Card", value: data.revenueByPaymentMethod.card },
        { name: "Online", value: data.revenueByPaymentMethod.online },
        { name: "Member Credit", value: data.revenueByPaymentMethod.memberCredit },
        { name: "Other", value: data.revenueByPaymentMethod.other },
    ].filter(d => d.value > 0) : [];

    const totalSourceRevenue = sourceData.reduce((s, d) => s + d.value, 0);

    return (
        <FeatureGate feature={["selling", "commerce"]}>
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-10">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <DashboardHeader
                    title="Commerce"
                    highlight="Analytics"
                    subtitle="Selling Intelligence"
                    description="Real-time revenue, inventory, and POS performance at a glance"
                    descriptionIconColor="primary"
                >
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                        <div className="flex flex-col items-end gap-0.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="h-10 md:h-12 rounded-xl border-white/5 bg-slate-950/20 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
                            </Button>
                            {cacheAge && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">
                                    Cached · {cacheAge}
                                </span>
                            )}
                        </div>
                        <Link href="/selling/products/new">
                            <Button className="w-full md:w-auto h-10 md:h-12 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all px-4 md:px-8 shadow-2xl active:scale-95 text-[10px]">
                                <Plus className="w-4 h-4 mr-2 stroke-[3px]" /> Quick Add
                            </Button>
                        </Link>
                    </div>
                </DashboardHeader>

                {/* ── Period Selector ─────────────────────────────────────────── */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mr-1">Period:</span>
                    {PERIODS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setPeriod(key)}
                            className={`h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
                                period === key
                                    ? "text-black shadow-lg"
                                    : "text-slate-500 bg-white/5 border border-white/5 hover:border-white/10"
                            }`}
                            style={period === key ? { background: "linear-gradient(135deg, #FF6B35, #FF8C42)", boxShadow: "0 4px 20px -4px rgba(255,107,53,0.5)" } : {}}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── 6 KPI Cards ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <KpiCard
                        label="Revenue" icon={CircleDollarSign} color={ORANGE} loading={loading}
                        value={`PKR ${fmtK(data?.periodRevenue || 0)}`}
                        sub={`All: PKR ${fmtK(data?.totalRevenue || 0)}`}
                        trend={data?.revenueTrend}
                    />
                    <KpiCard
                        label="Orders" icon={ShoppingBag} color={BLUE} loading={loading}
                        value={String(data?.periodOrders || 0)}
                        sub={`All: ${data?.totalOrders || 0}`}
                        trend={data?.ordersTrend}
                    />
                    <KpiCard
                        label="Avg Order Value" icon={TrendingUp} color={EMERALD} loading={loading}
                        value={`PKR ${fmtK(data?.periodAvgOrderValue || 0)}`}
                        sub={`All: PKR ${fmtK(data?.avgOrderValue || 0)}`}
                    />
                    <KpiCard
                        label="Units Sold" icon={Boxes} color={PURPLE} loading={loading}
                        value={String(data?.periodUnitsSold || 0)}
                        sub={`All: ${data?.totalUnitsSold || 0}`}
                    />
                    <KpiCard
                        label="Pending Orders" icon={Clock} color={AMBER} loading={loading}
                        value={String(data?.pendingOrders || 0)}
                        sub="Awaiting fulfillment"
                        href="/selling/orders"
                    />
                    <KpiCard
                        label="Low Stock" icon={AlertTriangle} color={ROSE} loading={loading}
                        value={String((data?.lowStockItems || 0) + (data?.outOfStockItems || 0))}
                        sub={`${data?.outOfStockItems || 0} out of stock`}
                        href="/selling/products"
                    />
                </div>

                {/* ── Revenue Trend Chart ─────────────────────────────────────── */}
                <div className="rounded-3xl border border-white/5 p-6"
                    style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Revenue Trend</p>
                            <h3 className="font-black text-lg text-white tracking-tight">Last 30 Days</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ORANGE }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: BLUE }} />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orders</span>
                            </div>
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={data?.revenueChart || []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.25} />
                                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={BLUE} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={fmtDate}
                                    tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700 }}
                                    axisLine={false} tickLine={false}
                                    interval={4}
                                />
                                <YAxis
                                    yAxisId="rev"
                                    tickFormatter={v => `${fmtK(v)}`}
                                    tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700 }}
                                    axisLine={false} tickLine={false} width={50}
                                />
                                <YAxis
                                    yAxisId="ord"
                                    orientation="right"
                                    tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700 }}
                                    axisLine={false} tickLine={false} width={30}
                                />
                                <Tooltip content={<RevenueTooltip />} />
                                <Area
                                    yAxisId="rev"
                                    type="monotone" dataKey="revenue" name="Revenue"
                                    stroke={ORANGE} strokeWidth={2.5}
                                    fill="url(#revGrad)"
                                />
                                <Area
                                    yAxisId="ord"
                                    type="monotone" dataKey="orders" name="Orders"
                                    stroke={BLUE} strokeWidth={2}
                                    fill="url(#ordGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* ── Breakdown Charts Row ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Revenue by Source */}
                    <div className="rounded-3xl border border-white/5 p-6"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Revenue by Channel</p>
                        <h3 className="font-black text-base text-white tracking-tight mb-6">Sales Source Split</h3>
                        {loading ? (
                            <div className="h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
                        ) : sourceData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-[10px] font-black text-slate-700 uppercase tracking-widest">No sales data for period</div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width="50%" height={160}>
                                    <PieChart>
                                        <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                                            dataKey="value" paddingAngle={3} strokeWidth={0}>
                                            {sourceData.map((_, i) => (
                                                <Cell key={i} fill={Object.values(SOURCE_COLORS)[i % 3]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="space-y-3 flex-1">
                                    {sourceData.map((item, i) => {
                                        const color = Object.values(SOURCE_COLORS)[i % 3];
                                        const pct = totalSourceRevenue > 0 ? Math.round((item.value / totalSourceRevenue) * 100) : 0;
                                        return (
                                            <div key={item.name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-white">{pct}%</span>
                                                </div>
                                                <div className="h-1 rounded-full bg-white/5">
                                                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Revenue by Payment Method */}
                    <div className="rounded-3xl border border-white/5 p-6"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Payment Methods</p>
                        <h3 className="font-black text-base text-white tracking-tight mb-6">Revenue by Method</h3>
                        {loading ? (
                            <div className="h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
                        ) : paymentData.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-[10px] font-black text-slate-700 uppercase tracking-widest">No sales data for period</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={paymentData} layout="vertical" margin={{ left: 0, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                                    <XAxis type="number" tickFormatter={v => fmtK(v)}
                                        tick={{ fill: "#4b5563", fontSize: 10, fontWeight: 700 }}
                                        axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={90}
                                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                                        axisLine={false} tickLine={false} />
                                    <Tooltip content={<PieTooltip />} />
                                    <Bar dataKey="value" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={20}>
                                        {paymentData.map((entry, i) => (
                                            <Cell key={i} fill={PAYMENT_COLORS[Object.keys(PAYMENT_COLORS)[i % 5]] || ORANGE} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* ── Top Products + Category Breakdown ───────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Top Products Table */}
                    <div className="lg:col-span-2 rounded-3xl border border-white/5 overflow-hidden"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Performance</p>
                                <h3 className="font-black text-base text-white tracking-tight">Top Products</h3>
                            </div>
                            <Link href="/selling/products">
                                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white h-8 px-3 rounded-xl">
                                    View All <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-12 px-6 py-2 border-b border-white/5">
                            <div className="col-span-1" />
                            <div className="col-span-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Product</p>
                            </div>
                            <div className="col-span-2 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Price</p>
                            </div>
                            <div className="col-span-2 text-center">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Sold</p>
                            </div>
                            <div className="col-span-3 text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Revenue</p>
                            </div>
                        </div>

                        <div className="divide-y divide-white/[0.03]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                                        <div className="h-4 w-4 rounded bg-white/5 animate-pulse" />
                                        <div className="h-4 flex-1 rounded bg-white/5 animate-pulse" />
                                        <div className="h-4 w-20 rounded bg-white/5 animate-pulse" />
                                    </div>
                                ))
                            ) : data?.topProducts?.length > 0 ? (
                                data.topProducts.map((product: any, idx: number) => (
                                    <div key={product._id} className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-white/[0.02] transition-colors">
                                        <div className="col-span-1">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                                idx === 0 ? "bg-amber-500/20 text-amber-400" :
                                                idx === 1 ? "bg-slate-500/20 text-slate-300" :
                                                idx === 2 ? "bg-orange-700/20 text-orange-600" :
                                                "bg-white/5 text-slate-600"
                                            }`}>
                                                {idx + 1}
                                            </div>
                                        </div>
                                        <div className="col-span-4 min-w-0">
                                            <p className="text-xs font-black text-white truncate">{product.name}</p>
                                            {/* Revenue share bar */}
                                            <div className="mt-1.5 h-0.5 rounded-full bg-white/5">
                                                <div className="h-full rounded-full"
                                                    style={{ width: `${product.revenueShare}%`, background: `linear-gradient(90deg, ${ORANGE}, ${AMBER})` }} />
                                            </div>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <p className="text-[11px] font-black text-slate-400">
                                                {product.unitPrice ? `PKR ${fmt(product.unitPrice)}` : "—"}
                                            </p>
                                        </div>
                                        <div className="col-span-2 text-center">
                                            <span className="text-[11px] font-black text-blue-400">{product.quantitySold}</span>
                                            <span className="text-[9px] text-slate-600 font-bold"> units</span>
                                        </div>
                                        <div className="col-span-3 text-right">
                                            <p className="text-xs font-black text-emerald-400">PKR {fmtK(product.revenue)}</p>
                                            <p className="text-[9px] font-bold text-slate-600">{product.revenueShare}% share</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-6 py-16 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                    No product sales for this period
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="rounded-3xl border border-white/5 p-6"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">By Category</p>
                        <h3 className="font-black text-base text-white tracking-tight mb-6">Category Sales</h3>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
                        ) : data?.categoryBreakdown?.length > 0 ? (
                            <div className="space-y-3">
                                {data.categoryBreakdown.map((cat: any, i: number) => {
                                    const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                                    const maxRev = data.categoryBreakdown[0]?.revenue || 1;
                                    const pct = Math.round((cat.revenue / maxRev) * 100);
                                    return (
                                        <div key={cat._id}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                                                    <span className="text-[10px] font-black text-white uppercase tracking-wide truncate max-w-[120px]">{cat._id}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-slate-300">PKR {fmtK(cat.revenue)}</p>
                                                    <p className="text-[9px] font-bold text-slate-600">{cat.unitsSold} units</p>
                                                </div>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/5">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-[10px] font-black text-slate-700 uppercase tracking-widest">No category data</div>
                        )}
                    </div>
                </div>

                {/* ── Bottom Row: Recent Orders + Inventory Alerts ──────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent Orders Feed */}
                    <div className="rounded-3xl border border-white/5 overflow-hidden"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Feed</p>
                                <h3 className="font-black text-base text-white tracking-tight">Recent Orders</h3>
                            </div>
                            <Link href="/selling/orders">
                                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white h-8 px-3 rounded-xl">
                                    All Orders <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                                        <div className="h-8 w-8 rounded-xl bg-white/5 animate-pulse" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                                            <div className="h-2.5 w-20 rounded bg-white/5 animate-pulse" />
                                        </div>
                                        <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
                                    </div>
                                ))
                            ) : data?.recentOrders?.length > 0 ? (
                                data.recentOrders.map((order: any) => {
                                    const isPending = order.status === "pending";
                                    const isCompleted = order.status === "completed";
                                    return (
                                        <div key={order._id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                                isPending ? "bg-amber-500/10" : isCompleted ? "bg-emerald-500/10" : "bg-rose-500/10"
                                            }`}>
                                                {isPending && <Clock className="w-4 h-4 text-amber-400" />}
                                                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                                                {!isPending && !isCompleted && <XCircle className="w-4 h-4 text-rose-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">
                                                    {order.memberId
                                                        ? `${order.memberId.firstName} ${order.memberId.lastName}`
                                                        : "Walk-in"}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{order.receiptNumber}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs font-black text-white">PKR {fmt(order.finalAmount)}</p>
                                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                                    {order.paymentMethod === "cash" && <Banknote className="w-3 h-3 text-slate-600" />}
                                                    {order.paymentMethod === "card" && <CreditCard className="w-3 h-3 text-slate-600" />}
                                                    {order.paymentMethod === "online" && <Smartphone className="w-3 h-3 text-slate-600" />}
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                        isPending ? "text-amber-500" : isCompleted ? "text-emerald-500" : "text-rose-500"
                                                    }`}>{order.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-6 py-16 text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                    No orders yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inventory Alerts (Enhanced) */}
                    <div className="rounded-3xl border border-white/5 overflow-hidden"
                        style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Inventory</p>
                                <h3 className="font-black text-base text-white tracking-tight">Stock Alerts</h3>
                            </div>
                            <Badge className="text-[10px] font-black border-none"
                                style={{ background: "rgba(244,63,94,0.1)", color: ROSE }}>
                                {(data?.inventoryAlerts?.length || 0)} ALERTS
                            </Badge>
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="px-6 py-4 flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-white/5 animate-pulse" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
                                            <div className="h-2.5 w-20 rounded bg-white/5 animate-pulse" />
                                        </div>
                                    </div>
                                ))
                            ) : data?.inventoryAlerts?.length > 0 ? (
                                data.inventoryAlerts.map((alert: any) => {
                                    const isOut = alert.stockQuantity === 0;
                                    return (
                                        <div key={alert._id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${
                                                isOut ? "bg-rose-500/10" : "bg-amber-500/10"
                                            }`}>
                                                {alert.thumbnail?.url
                                                    ? <img src={alert.thumbnail.url} alt={alert.name} className="w-full h-full object-cover" />
                                                    : <Package className={`w-4 h-4 ${isOut ? "text-rose-400" : "text-amber-400"}`} />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{alert.name}</p>
                                                <p className={`text-[9px] font-black uppercase tracking-widest ${isOut ? "text-rose-400" : "text-amber-400"}`}>
                                                    {isOut ? "⚡ Out of Stock" : `${alert.stockQuantity} left (threshold: ${alert.lowStockThreshold})`}
                                                </p>
                                            </div>
                                            <Link href={`/selling/products`}>
                                                <button className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg transition-all hover:scale-105 ${
                                                    isOut ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                                }`}>
                                                    Restock
                                                </button>
                                            </Link>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-6 py-16 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">All stock healthy</p>
                                </div>
                            )}
                        </div>

                        {/* Quick nav links */}
                        <div className="px-6 py-4 border-t border-white/5 grid grid-cols-2 gap-3">
                            <Link href="/selling/products" className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                                <Package className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Catalog</span>
                                <ArrowUpRight className="w-3 h-3 ml-auto text-slate-700 group-hover:text-primary" />
                            </Link>
                            <Link href="/selling/categories" className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
                                <Layers className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">Categories</span>
                                <ArrowUpRight className="w-3 h-3 ml-auto text-slate-700 group-hover:text-primary" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Quick Nav Cards ──────────────────────────────────────────── */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-4">Quick Access</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { href: "/selling/orders", label: "Orders", sub: "Manage fulfillment", icon: ClipboardList, color: AMBER, count: data?.pendingOrders },
                            { href: "/selling/pos", label: "Point of Sale", sub: "Direct sales terminal", icon: ShoppingCart, color: EMERALD },
                            { href: "/selling/api-keys", label: "Storefront API", sub: "External integrations", icon: Key, color: BLUE },
                            { href: "/audit-logs", label: "Activity Log", sub: "Full audit trail", icon: Activity, color: PURPLE },
                        ].map(({ href, label, sub, icon: Icon, color, count }) => (
                            <Link key={href} href={href} className="group">
                                <div className="rounded-2xl border border-white/5 p-5 flex flex-col gap-4 transition-all duration-300 hover:border-white/10 hover:scale-[1.02]"
                                    style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}>
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                            style={{ background: `${color}15` }}>
                                            <Icon className="w-5 h-5" style={{ color }} />
                                        </div>
                                        {count !== undefined && count > 0 && (
                                            <div className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                                                {count}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{label}</p>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">{sub}</p>
                                    </div>
                                    <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>Open</span>
                                        <ArrowUpRight className="w-3 h-3" style={{ color }} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </FeatureGate>
    );
}
