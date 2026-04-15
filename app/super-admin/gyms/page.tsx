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
    BadgeCheck,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
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
        <div className="space-y-10 animate-fade-up">
            <DashboardHeader
                title="OUR"
                highlight="GYMS"
                subtitle="Gym Database"
                description={`${pagination.total || 0} gyms registered on the platform`}
                descriptionIconColor="emerald"
            >
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-[38px] px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group gap-2"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    REGISTER NEW GYM
                </Button>
            </DashboardHeader>

            {/* Filters - Bento Style */}
            <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40">
                <div className="flex gap-6 items-end flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
                            Search Gym Registry
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search by gym name, owner, or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-[38px] pl-12 pr-4 rounded-xl bg-black/10 dark:bg-white/5 border-transparent text-sm text-foreground font-black italic tracking-tighter focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
                            City Location
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Lahore"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="w-full h-[38px] px-6 rounded-xl bg-black/10 dark:bg-white/5 border-transparent text-[10px] text-foreground font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-600"
                        />
                    </div>


                    <div className="min-w-[180px]">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">
                            Filter by Status
                        </label>
                        <Select
                            value={statusFilter || "all"}
                            onValueChange={(value) => {
                                setStatusFilter(value === "all" ? "" : value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full h-[38px] px-6 rounded-xl border-transparent bg-black/10 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-white/10 text-white">
                                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All Statuses</SelectItem>
                                <SelectItem value="active" className="text-[10px] font-bold uppercase tracking-widest">Active</SelectItem>
                                <SelectItem value="trial" className="text-[10px] font-bold uppercase tracking-widest">Trial</SelectItem>
                                <SelectItem value="expired" className="text-[10px] font-bold uppercase tracking-widest">Expired</SelectItem>
                                <SelectItem value="suspended" className="text-[10px] font-bold uppercase tracking-widest">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>


                    <Button
                        variant="ghost"
                        className={cn(
                            "h-[38px] px-6 rounded-xl border font-black italic tracking-tighter text-[10px] uppercase group transition-all",
                            !showDeleted
                                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                : "bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        )}
                        onClick={() => { setShowDeleted(!showDeleted); setPage(1); }}
                    >

                        {showDeleted ? <BadgeCheck className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                        {showDeleted ? "Back to Active" : "View Deleted"}
                    </Button>
                </div>
            </div>

            {/* Table - Glass Style */}
            <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
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
                                    "Actions",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-6 py-6 text-left font-black text-slate-500 italic"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <tr key={i} className="border-b border-black/5 dark:border-white/5 animate-pulse">
                                        <td className="px-6 py-6" colSpan={2}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-white/5 rounded" />
                                                    <div className="h-3 w-40 bg-white/5 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6"><div className="h-3 w-16 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-3 w-12 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-6 w-20 bg-white/5 rounded-lg" /></td>
                                        <td className="px-6 py-6"><div className="h-4 w-12 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-4 w-20 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-3 w-8 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-3 w-20 bg-white/5 rounded" /></td>
                                        <td className="px-6 py-6"><div className="h-9 w-9 bg-white/5 rounded-xl ml-auto" /></td>
                                    </tr>
                                ))
                            ) : gyms.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500 font-black italic uppercase tracking-widest text-[10px]">
                                        No gyms found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                gyms.map((gym) => {
                                    const badge = gym.deletedAt ? STATUS_BADGES.deleted : (STATUS_BADGES[gym.subscriptionStatus] || STATUS_BADGES.trial);
                                    return (
                                        <tr
                                            key={gym.id}
                                            className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer transition-colors group/row"
                                            onClick={() => router.push(`/super-admin/gyms/${gym.id}`)}
                                        >
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-[0_0_15px_rgba(var(--indigo-500),0.1)] group-hover/row:bg-indigo-500/20 transition-colors">
                                                        <Building2 className="w-5 h-5 text-indigo-400" />
                                                    </div>
                                                    <span className="text-foreground font-black italic tracking-tighter text-base block group-hover/row:text-primary transition-colors">
                                                        {gym.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div>
                                                    <p className="text-foreground font-black italic tracking-tighter text-sm mb-0.5">{gym.ownerName}</p>
                                                    <p className="text-[9px] text-slate-500 font-mono tracking-widest lowercase">{gym.ownerEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-slate-500 font-black italic tracking-widest text-[10px]">{gym.city || "—"}</td>
                                            <td className="px-6 py-6">
                                                <span className="text-[10px] font-black italic tracking-widest text-indigo-400">{gym.planName}</span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black italic tracking-widest",
                                                        badge.class
                                                    )}
                                                >
                                                    <div className={cn("w-1 h-1 rounded-full bg-current")} />
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Users className="w-4 h-4 text-slate-500" />
                                                    <span className="text-base font-black italic tracking-tighter">{gym.totalMembers}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-base font-black italic tracking-tighter text-emerald-400">
                                                {formatPKR(gym.totalRevenue)}
                                            </td>
                                            <td className="px-6 py-6 text-slate-500 font-mono text-[10px]">{gym.branchCount}</td>
                                            <td className="px-6 py-6 text-slate-500 font-mono text-[10px]">
                                                {gym.expiryDate
                                                    ? new Date(gym.expiryDate).toLocaleDateString("en-PK").toUpperCase()
                                                    : "—"}
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center justify-end gap-3">
                                                    {gym.deletedAt && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                                            title="Delete Permanently"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setGymToDelete(gym.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover/row:text-primary transition-colors">
                                                        <ExternalLink className="w-4 h-4" />
                                                    </div>
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
                    <div className="flex items-center justify-between px-6 py-6 border-t border-white/5 bg-white/[0.01]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">
                            Page {page} of {pagination.totalPages} <span className="mx-2 opacity-20">|</span> {pagination.total} ENTRIES FOUND
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                disabled={page >= pagination.totalPages}
                                className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
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
                        <h3 className="text-sm font-semibold text-white mb-4 pr-6">Permanently Delete Gym</h3>
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Warning: This cannot be undone</p>
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
