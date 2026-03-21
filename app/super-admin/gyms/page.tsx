"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Filter,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Users,
    CreditCard,
    Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateGymModal } from "@/components/super-admin/create-gym-modal";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    trial: { label: "Trial", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    expired: { label: "Expired", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    suspended: { label: "Suspended", class: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
};

export default function GymsPage() {
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchGyms = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (statusFilter) params.set("status", statusFilter);
            if (cityFilter) params.set("city", cityFilter);
            params.set("page", page.toString());
            params.set("limit", "15");

            const res = await fetch(`/api/super-admin/gyms?${params.toString()}`);
            const data = await res.json();
            setGyms(data.gyms || []);
            setPagination(data.pagination || {});
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, cityFilter, page]);

    useEffect(() => {
        const timeout = setTimeout(fetchGyms, 300);
        return () => clearTimeout(timeout);
    }, [fetchGyms]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Gym Management</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {pagination.total || 0} gyms registered on the platform
                    </p>
                </div>

                <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Gym
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[250px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search by gym name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer min-w-[140px]"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trial">Trial</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                </select>

                <input
                    type="text"
                    placeholder="Filter by city..."
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 min-w-[150px]"
                />
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/[0.06]">
                                {[
                                    "Gym Name",
                                    "Owner",
                                    "City",
                                    "Plan",
                                    "Status",
                                    "Members",
                                    "Revenue",
                                    "Branches",
                                    "Expiry",
                                    "",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/[0.04]">
                                        {Array.from({ length: 10 }).map((_, j) => (
                                            <td key={j} className="px-4 py-4">
                                                <div className="h-4 w-20 bg-white/[0.04] rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : gyms.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                                        No gyms found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                gyms.map((gym) => {
                                    const badge = STATUS_BADGES[gym.subscriptionStatus] || STATUS_BADGES.trial;
                                    return (
                                        <tr
                                            key={gym.id}
                                            className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors"
                                            onClick={() => router.push(`/super-admin/gyms/${gym.id}`)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                                                        <Building2 className="w-4 h-4 text-indigo-400" />
                                                    </div>
                                                    <span className="font-medium text-white truncate max-w-[160px]">
                                                        {gym.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-white text-xs font-medium">{gym.ownerName}</p>
                                                    <p className="text-slate-500 text-[11px]">{gym.ownerEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 text-xs">{gym.city || "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs font-medium text-indigo-400">{gym.planName}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={cn(
                                                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border",
                                                        badge.class
                                                    )}
                                                >
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-slate-300">
                                                    <Users className="w-3.5 h-3.5 text-slate-500" />
                                                    <span className="text-xs font-medium">{gym.totalMembers}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-emerald-400">
                                                {formatPKR(gym.totalRevenue)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-400">{gym.branchCount}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400">
                                                {gym.expiryDate
                                                    ? new Date(gym.expiryDate).toLocaleDateString("en-PK")
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <ExternalLink className="w-4 h-4 text-slate-500" />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                        <p className="text-xs text-slate-500">
                            Page {page} of {pagination.totalPages} ({pagination.total} total)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-md bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                disabled={page >= pagination.totalPages}
                                className="p-1.5 rounded-md bg-white/[0.04] text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <CreateGymModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={fetchGyms}
            />
        </div>
    );
}
