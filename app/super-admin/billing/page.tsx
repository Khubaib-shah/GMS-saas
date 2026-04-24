"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Receipt,
    Search,
    DollarSign,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Building2,
    CalendarDays,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

export default function BillingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [page, setPage] = useState(1);

    const fetchBilling = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange?.from) params.set("from", dateRange.from.toISOString());
            if (dateRange?.to) params.set("to", dateRange.to.toISOString());
            params.set("page", page.toString());
            params.set("limit", "15");

            const res = await fetch(`/api/super-admin/billing?${params.toString()}`);
            const d = await res.json();
            setData(d);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [dateRange, page]);

    useEffect(() => {
        fetchBilling();
    }, [fetchBilling]);

    const payments = data?.payments || [];
    const pagination = data?.pagination || {};

    return (
        <div className="space-y-6 animate-fade-in">
            <DashboardHeader
                title="PLATFORM"
                highlight="REVENUE"
                subtitle="ADMIN: FINANCIALS_v3"
                description="Manual billing records for all gyms"
                descriptionIconColor="emerald"
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { 
                        title: dateRange?.from ? "Filtered Revenue" : "Total Revenue", 
                        value: formatPKR(data?.totalRevenuePKR || 0), 
                        icon: DollarSign, 
                        color: "emerald" 
                    },
                    { 
                        title: "Overdue Gyms", 
                        value: data?.overdueGyms || 0, 
                        icon: AlertTriangle, 
                        color: "amber" 
                    },
                    { 
                        title: "Total Records", 
                        value: pagination.total || 0, 
                        icon: Receipt, 
                        color: "indigo" 
                    }
                ].map((kpi, idx) => (
                    <div key={idx} className="glass-premium p-6 flex items-center gap-4 bg-card dark:bg-slate-950/40 border-border">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border",
                            kpi.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            kpi.color === "amber" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        )}>
                            <kpi.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic mb-1">{kpi.title}</p>
                            <p className={cn(
                                "text-2xl font-black italic tracking-tighter",
                                kpi.color === "emerald" ? "text-emerald-400" :
                                kpi.color === "amber" ? "text-amber-400" :
                                "text-indigo-400"
                            )}>
                                {kpi.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center justify-end gap-4 mt-8">
                <DateRangePicker
                    date={dateRange}
                    onDateChange={(range) => {
                        setDateRange(range);
                        setPage(1);
                    }}
                />
            </div>

            {/* Table */}
            <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40 mt-8">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                {["Gym", "Plan", "Amount", "Method", "Date", "Expiry", "Notes", "Admin"].map((h) => (
                                    <th key={h} className="px-6 py-6 text-left font-black text-slate-500 italic tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-black/5 dark:border-white/5 animate-pulse">
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-6 py-6">
                                                <div className="h-4 bg-white/5 rounded w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50 italic">
                                            <Receipt className="w-8 h-8 text-slate-600 mb-2" />
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">No billing records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p: any) => (
                                    <tr key={p.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover/row:bg-indigo-500/20 transition-colors">
                                                    <Building2 className="w-4 h-4 text-indigo-400" />
                                                </div>
                                                <span className="text-foreground font-black italic tracking-tighter text-sm group-hover/row:text-primary transition-colors">{p.gymName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-black italic tracking-widest text-indigo-400/80">{p.planName || "—"}</td>
                                        <td className="px-6 py-6 text-base font-black italic tracking-tighter text-emerald-400">{formatPKR(p.amountPKR)}</td>
                                        <td className="px-6 py-6 text-[10px] text-slate-400 uppercase tracking-widest">{p.paymentMethod?.replace("_", " ")}</td>
                                        <td className="px-6 py-6 font-mono text-[10px] text-slate-500">{new Date(p.paymentDate).toLocaleDateString("en-PK").toUpperCase()}</td>
                                        <td className="px-6 py-6 font-mono text-[10px] text-slate-500">{new Date(p.expiryDate).toLocaleDateString("en-PK").toUpperCase()}</td>
                                        <td className="px-6 py-6 text-[10px] font-medium text-slate-500 italic max-w-[200px] truncate">{p.notes || "—"}</td>
                                        <td className="px-6 py-6 text-[10px] font-black italic tracking-widest text-slate-400">{p.enteredByName}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-6 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                            Page {page} of {pagination.totalPages} <span className="mx-2 opacity-20">|</span> {pagination.total} RECORDS FOUND
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all flex items-center justify-center"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                disabled={page >= pagination.totalPages}
                                className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all flex items-center justify-center"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
