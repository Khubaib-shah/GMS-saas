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
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            {dateRange?.from ? "Filtered Revenue" : "Total Revenue"}
                        </p>
                        <p className="text-xl font-bold text-emerald-400">
                            {formatPKR(data?.totalRevenuePKR || 0)}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Overdue Gyms</p>
                        <p className="text-xl font-bold text-amber-400">{data?.overdueGyms || 0}</p>
                    </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Total Records</p>
                        <p className="text-xl font-bold text-indigo-400">{pagination.total || 0}</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-end">
                <div className="flex items-center  gap-4">
                    <DateRangePicker
                        date={dateRange}
                        onDateChange={(range) => {
                            setDateRange(range);
                            setPage(1);
                        }}
                    />
                </div>

                {dateRange?.from && (
                    <button
                        onClick={() => { setDateRange(undefined); setPage(1); }}
                        className="text-[10px] font-black tracking-widest text-indigo-400 hover:text-indigo-300 uppercase transition-colors"
                    >
                        RESET FILTERS
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                {["Gym", "Plan", "Amount", "Method", "Payment Date", "Expiry", "Notes", "Entered By"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.04]">
                                        <td className="px-4 py-4"><div className="h-4 w-32 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-20 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-16 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-32 bg-white/5 animate-pulse rounded" /></td>
                                        <td className="px-4 py-4"><div className="h-4 w-24 bg-white/5 animate-pulse rounded" /></td>
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
                                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="text-white font-medium text-xs">{p.gymName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-indigo-400 font-medium">{p.planName || "—"}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{formatPKR(p.amountPKR)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-300 capitalize">{p.paymentMethod?.replace("_", " ")}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.paymentDate).toLocaleDateString("en-PK")}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{new Date(p.expiryDate).toLocaleDateString("en-PK")}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate">{p.notes || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400">{p.enteredByName}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                        <p className="text-xs text-slate-500">
                            Page {page} of {pagination.totalPages} ({pagination.total} total)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-md bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                disabled={page >= pagination.totalPages}
                                className="p-1.5 rounded-md bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30"
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
