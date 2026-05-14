"use client";

import { useState } from "react";
import {
    ShoppingBag,
    Plus,
    ArrowUpRight,
    Package,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    Layers,
    Tag,
    Key,
    History,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { StatsCard } from "@/components/stats-card";
import { FeatureGate } from "@/components/ui/feature-gate";

export default function SellingDashboard() {
    const stats = [
        { label: "Total Products", value: "0", icon: Package, trend: "+0%" },
        { label: "Low Stock Items", value: "0", icon: AlertTriangle, trend: "0" },
        { label: "Total Revenue", value: "PKR 0", icon: TrendingUp, trend: "+0%" },
        { label: "Total Orders", value: "0", icon: ShoppingBag, trend: "+0%" },
    ];

    return (
        <FeatureGate feature={["selling", "commerce"]}>
            <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
                <DashboardHeader
                    title="Commerce"
                    highlight="Dashboard"
                    subtitle="Selling Center"
                    description="Real-time commerce operations and inventory intelligence"
                    descriptionIconColor="primary"
                >
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                        <Link href="/audit-logs" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full h-10 md:h-12 rounded-xl md:rounded-2xl border-white/5 bg-slate-950/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-6 hover:bg-white/5 transition-all">
                                <History className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
                                Activity Log
                            </Button>
                        </Link>
                        <Link href="/selling/products/new" className="flex-1 md:flex-none">
                            <Button className="w-full md:w-auto h-10 md:h-12 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all px-4 md:px-8 shadow-2xl active:scale-95 text-[9px] md:text-[10px]">
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2 stroke-[3px]" />
                                Quick Add
                            </Button>
                        </Link>
                    </div>
                </DashboardHeader>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <StatsCard
                            key={i}
                            title={stat.label}
                            value={stat.value}
                            icon={<stat.icon className="w-5 h-5" />}
                            trend={stat.trend ? {
                                value: parseFloat(stat.trend),
                                isPositive: !stat.trend.startsWith("-")
                            } : undefined}
                        />
                    ))}
                </div>

                {/* Quick Actions & Navigation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Navigation Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Link href="/selling/products" className="group">
                            <Card className="glass-premium h-full bg-slate-950/20 border-white/5 p-6 md:p-8 flex flex-col items-start gap-6 md:gap-8 hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-500 rounded-[24px] md:rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-16 -translate-y-8" />
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-500 group-hover:scale-110 shadow-2xl">
                                    <Package className="w-8 h-8" />
                                </div>
                                <div className="space-y-3 text-left relative">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Product Catalog</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] leading-relaxed max-w-[200px]">
                                        Manage your full inventory, categories, and brands
                                    </p>
                                </div>
                                <div className="mt-auto pt-8 flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Open Management</span>
                                    <ArrowUpRight className="w-4 h-4 text-primary" />
                                </div>
                            </Card>
                        </Link>

                        <Link href="/selling/api-keys" className="group">
                            <Card className="glass-premium h-full bg-slate-950/20 border-white/5 p-6 md:p-8 flex flex-col items-start gap-6 md:gap-8 hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-500 rounded-[24px] md:rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-16 -translate-y-8" />
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-500 group-hover:scale-110 shadow-2xl">
                                    <Key className="w-8 h-8" />
                                </div>
                                <div className="space-y-3 text-left relative">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">API Keys</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] leading-relaxed max-w-[200px]">
                                        Generate secure keys to use your catalog on any website
                                    </p>
                                </div>
                                <div className="mt-auto pt-8 flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Manage Keys</span>
                                    <ArrowUpRight className="w-4 h-4 text-primary" />
                                </div>
                            </Card>
                        </Link>

                        <Link href="/selling/categories" className="group">
                            <Card className="glass-premium h-full bg-slate-950/20 border-white/5 p-6 md:p-8 flex flex-col items-start gap-6 md:gap-8 hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-500 rounded-[24px] md:rounded-3xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-16 -translate-y-8" />
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all duration-500 group-hover:scale-110 shadow-2xl">
                                    <Tag className="w-8 h-8" />
                                </div>
                                <div className="space-y-3 text-left relative">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Categories</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] leading-relaxed max-w-[200px]">
                                        Organize products into groups and collections
                                    </p>
                                </div>
                                <div className="mt-auto pt-8 flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Edit Categories</span>
                                    <ArrowUpRight className="w-4 h-4 text-primary" />
                                </div>
                            </Card>
                        </Link>

                        <Link href="/selling/inventory" className="group grayscale opacity-50 cursor-not-allowed">
                            <Card className="glass-premium h-full bg-slate-950/20 border-white/5 p-6 md:p-8 flex flex-col items-start gap-6 md:gap-8 rounded-[24px] md:rounded-3xl relative overflow-hidden">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600">
                                    <Layers className="w-8 h-8" />
                                </div>
                                <div className="space-y-3 text-left relative">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-400">Inventory Logs</h3>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.15em] leading-relaxed">
                                        Stock adjustments and tracking (Coming Soon)
                                    </p>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Right Column: Alerts/Recent */}
                    <div className="space-y-6">
                        <Card className="bg-slate-950/20 border-white/5 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest">Inventory Alerts</h3>
                                <Badge className="bg-rose-500/10 text-rose-500 border-none text-[10px] font-black">0 ALERTS</Badge>
                            </div>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center py-8">
                                    All stock levels healthy
                                </p>
                            </div>
                        </Card>

                        <Card className="bg-slate-950/20 border-white/5 p-6 overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-5">
                                <BarChart3 className="w-32 h-32" />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Top Products</h3>
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center py-8">
                                    No sales data yet
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
