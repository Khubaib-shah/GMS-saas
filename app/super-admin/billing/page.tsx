"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Receipt,
    Search,
    DollarSign,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

export default function BillingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState("");
    const [page, setPage] = useState(1);

    const fetchBilling = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (month) params.set("month", month);
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
    }, [month, page]);

    useEffect(() => {
        fetchBilling();
    }, [fetchBilling]);

    const payments = data?.payments || [];
    const pagination = data?.pagination || {};

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Platform Billing</h1>
                <p className="text-sm text-slate-500 mt-1">Manual billing records for all gyms</p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                            {month ? "Filtered Revenue" : "Total Revenue"}
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
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => { setMonth(e.target.value); setPage(1); }}
                        className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                {month && (
                    <button
                        onClick={() => { setMonth(""); setPage(1); }}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                        Clear filter
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
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 w-20 bg-white/[0.04] rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        No billing records found
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
