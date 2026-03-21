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
    Trash2,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreateGymModal } from "@/components/super-admin/create-gym-modal";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    trial: { label: "Trial", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    expired: { label: "Expired", class: "bg-red-500/10 text-red-400 border-red-500/20" },
    suspended: { label: "Suspended", class: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
    deleted: { label: "Deleted", class: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export default function GymsPage() {
    const router = useRouter();
    const [gyms, setGyms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [debouncedCity, setDebouncedCity] = useState("");
    const [page, setPage] = useState(1);
    const [showDeleted, setShowDeleted] = useState(false);
    const [pagination, setPagination] = useState<any>({ total: 0, totalPages: 1 });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [gymToDelete, setGymToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounce search and city filters
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 700);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCity(cityFilter);
            setPage(1);
        }, 700);
        return () => clearTimeout(timer);
    }, [cityFilter]);

    const fetchGyms = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (statusFilter) params.set("status", statusFilter);
            if (debouncedCity) params.set("city", debouncedCity);
            if (showDeleted) params.set("isDeleted", "true");
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
    }, [debouncedSearch, statusFilter, debouncedCity, page, showDeleted]);

    useEffect(() => {
        fetchGyms();
    }, [fetchGyms]);

    const handleHardDelete = async () => {
        if (!gymToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/super-admin/gyms/${gymToDelete}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "hardDelete" }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            toast.success("Gym permanently deleted");
            setGymToDelete(null);
            fetchGyms();
        } catch (error: any) {
            toast.error(error.message || "Failed to delete gym");
        } finally {
            setIsDeleting(false);
        }
    };

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
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                </div>

                <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => {
                        setStatusFilter(value === "all" ? "" : value);
                        setPage(1);
                    }}
                >
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-sm text-slate-300 h-[42px] min-w-[140px]">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a24] border-white/[0.08] text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>

                <input
                    type="text"
                    placeholder="Filter by city..."
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 min-w-[150px]"
                />

                <Button
                    variant={showDeleted ? "default" : "outline"}
                    className={cn(
                        "h-[42px] px-4",
                        !showDeleted
                            ? "bg-transparent border-white/[0.08] text-slate-300 hover:text-white"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/50 hover:bg-rose-500/30 font-medium"
                    )}
                    onClick={() => { setShowDeleted(!showDeleted); setPage(1); }}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {showDeleted ? "Showing Archive" : "Show Archive"}
                </Button>
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
                                    const badge = gym.deletedAt ? STATUS_BADGES.deleted : (STATUS_BADGES[gym.subscriptionStatus] || STATUS_BADGES.trial);
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
                                                <div className="flex items-center justify-end gap-2">
                                                    {gym.deletedAt && (
                                                        <button
                                                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                                                            title="Delete Permanently"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setGymToDelete(gym.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <ExternalLink className="w-4 h-4 text-slate-500" />
                                                </div>
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

            {/* Hard Delete Modal */}
            {gymToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setGymToDelete(null)}>
                    <div className="bg-[#111118] border border-white/[0.08] rounded-xl p-6 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setGymToDelete(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h3 className="text-sm font-semibold text-white mb-4 pr-6">Confirm Permanent Delete</h3>
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Warning: Irreversible Action</p>
                            <p className="text-sm text-slate-300">This will completely delete the gym and <strong className="text-white">all</strong> of its associated user accounts, members, payments, and subscriptions from the database permanently.</p>
                            <div className="flex gap-3 justify-end mt-4">
                                <button
                                    onClick={() => setGymToDelete(null)}
                                    className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleHardDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                                >
                                    {isDeleting ? "Deleting..." : "Delete Permanently"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
