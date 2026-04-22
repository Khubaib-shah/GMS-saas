"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Building2,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Users,
    Activity,
    DollarSign,
    Shield,
    ShieldOff,
    Clock,
    RefreshCw,
    Key,
    Trash2,
    CheckCircle,
    Ban,
    Plus,
    Edit2,
    X,
    ToggleLeft,
    ToggleRight,
    Search
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EditGymModal } from "@/components/super-admin/edit-gym-modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

export default function GymDetailPage() {
    const params = useParams();
    const router = useRouter();
    const gymId = params.id as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showExtendModal, setShowExtendModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showSuspendModal, setShowSuspendModal] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showHardDeleteModal, setShowHardDeleteModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", notes: "", expiryDate: "" });
    const [extendDays, setExtendDays] = useState("30");
    const [plans, setPlans] = useState<any[]>([]);

    const fetchGym = async () => {
        try {
            const res = await fetch(`/api/super-admin/gyms/${gymId}`);
            const d = await res.json();
            setData(d);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGym();
        fetch("/api/super-admin/plans").then(r => r.json()).then(d => setPlans(d.plans || []));
    }, [gymId]);

    const doAction = async (action: string, extra: any = {}) => {
        setActionLoading(action);
        try {
            const res = await fetch(`/api/super-admin/gyms/${gymId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...extra }),
            });
            const d = await res.json();
            if (!res.ok) throw new Error(d.message);
            toast.success(d.message || "Action completed");
            await fetchGym();
        } catch (e: any) {
            toast.error(e.message || "Action failed");
        } finally {
            setActionLoading("");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-white/[0.04] rounded animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[300px] bg-white/[0.03] rounded-xl border border-white/[0.06] animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data?.gym) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-slate-400">Gym not found</p>
                <button onClick={() => router.back()} className="text-indigo-400 text-sm hover:underline">Go back</button>
            </div>
        );
    }

    const { gym, owner, stats, platformPayments } = data;

    const statusBadge: Record<string, { label: string; cls: string }> = {
        active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
        trial: { label: "Trial", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
        expired: { label: "Expired", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
        suspended: { label: "Suspended", cls: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
        deleted: { label: "Deleted", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    };
    const badge = gym.deletedAt ? statusBadge.deleted : (statusBadge[gym.subscriptionStatus] || statusBadge.trial);

    return (
        <div className="space-y-10 animate-fade-up">
            {/* Back + Title */}
            <div className="flex items-center gap-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/super-admin/gyms")}
                    className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-black italic tracking-tighter text-foreground uppercase">{gym.name}</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowEditModal(true)}
                            className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-primary transition-colors"
                            title="Edit Gym Info"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <span className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[10px] font-black italic tracking-widest uppercase", badge.cls)}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                            {badge.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Registry Instance:</span>
                        <code className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">{gym.id}</code>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Basic Info */}
                <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40 space-y-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Gym Details</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="space-y-5">
                        <InfoRow icon={Building2} label="Gym Name" value={gym.name} />
                        <InfoRow icon={User} label="Owner" value={owner?.name || "N/A"} />
                        <InfoRow icon={Mail} label="Email" value={owner?.email || "N/A"} />
                        <InfoRow icon={Phone} label="Phone" value={gym.phone || owner?.phone || "N/A"} />
                        <InfoRow icon={MapPin} label="Address" value={gym.address || "N/A"} />
                        <InfoRow icon={MapPin} label="City" value={gym.city || "N/A"} />
                        <InfoRow icon={Calendar} label="Registered" value={new Date(gym.createdAt).toLocaleDateString("en-PK").toUpperCase()} />
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40 space-y-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Subscription</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="space-y-5">
                        <InfoRow icon={CreditCard} label="Plan" value={gym.plan?.name || "No Plan"} highlight />
                        <InfoRow icon={DollarSign} label="Price" value={gym.plan ? formatPKR(gym.plan.monthlyPricePKR) + "/mo" : "—"} />
                        <InfoRow icon={Calendar} label="Expiry" value={gym.expiryDate ? new Date(gym.expiryDate).toLocaleDateString("en-PK").toUpperCase() : "—"} />
                        <InfoRow icon={Clock} label="Trial Ends" value={gym.trialEndsAt ? new Date(gym.trialEndsAt).toLocaleDateString("en-PK").toUpperCase() : "—"} />
                        <InfoRow icon={DollarSign} label="Outstanding" value={formatPKR(gym.outstandingAmount)} highlight={gym.outstandingAmount > 0} />
                        {gym.isSuspended && (
                            <InfoRow icon={Ban} label="Reason" value={gym.suspensionReason || "N/A"} error />
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40 space-y-8">
                    <div className="flex items-center gap-4">
                        <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Performance Stats</h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Total Members" value={stats.totalMembers} icon={Users} />
                        <StatCard label="Active Clients" value={stats.activeMembers} icon={Activity} />
                        <StatCard label="Trainers" value={stats.trainersCount} icon={User} />
                        <StatCard label="Branches" value={stats.branchCount} icon={Building2} />
                    </div>
                    <div className="pt-6 border-t border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Total Gym Revenue Pool</p>
                        <p className="text-3xl font-black italic tracking-tighter text-emerald-400">{formatPKR(stats.totalRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40 space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Administrative Control Panel</h3>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    {gym.deletedAt ? (
                        <>
                            <ActionButton
                                icon={RefreshCw}
                                label="Restore Gym"
                                color="emerald"
                                loading={actionLoading === "restore"}
                                onClick={() => doAction("restore")}
                            />
                            <ActionButton
                                icon={Trash2}
                                label="Delete Permanently"
                                color="red"
                                loading={actionLoading === "hardDelete"}
                                onClick={() => setShowHardDeleteModal(true)}
                            />
                        </>
                    ) : (
                        <>
                            {gym.subscriptionStatus !== "active" && (
                                <ActionButton
                                    icon={CheckCircle}
                                    label="Activate Platform"
                                    color="emerald"
                                    loading={actionLoading === "activate"}
                                    onClick={() => doAction("activate")}
                                />
                            )}
                            {!gym.isSuspended ? (
                                <ActionButton
                                    icon={Ban}
                                    label="Suspend Instance"
                                    color="red"
                                    loading={actionLoading === "suspend"}
                                    onClick={() => setShowSuspendModal(true)}
                                />
                            ) : (
                                <ActionButton
                                    icon={ShieldOff}
                                    label="Unsuspend/Lift Ban"
                                    color="amber"
                                    loading={actionLoading === "unsuspend"}
                                    onClick={() => doAction("unsuspend")}
                                />
                            )}
                            <ActionButton
                                icon={Clock}
                                label="Extend Expire"
                                color="blue"
                                loading={actionLoading === "extend"}
                                onClick={() => setShowExtendModal(true)}
                            />
                            <ActionButton
                                icon={Plus}
                                label="Record Payment"
                                color="green"
                                onClick={() => setShowPaymentModal(true)}
                            />
                            <ActionButton
                                icon={Key}
                                label="Reset Master PIN"
                                color="amber"
                                loading={actionLoading === "resetPassword"}
                                onClick={() => setShowResetPasswordModal(true)}
                            />

                            <div className="min-w-[200px]">
                                <Select
                                    value={gym.plan?.id || ""}
                                    onValueChange={(value) => {
                                        if (value && value !== (gym.plan?.id || "")) {
                                            doAction("changePlan", { planId: value });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="glass-premium h-11 border-white/10 bg-white/5 px-4 w-full text-slate-300 font-black italic tracking-widest text-[10px] uppercase transition-all hover:bg-white/10">
                                        <SelectValue placeholder="Change Tier..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10 text-white z-[70] max-h-60 overflow-y-auto custom-scrollbar">
                                        {plans.map((p: any) => (
                                            <SelectItem key={p._id || p.id} value={p._id || p.id} className="text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                                                {p.name} — {formatPKR(p.monthlyPricePKR)}/mo
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ActionButton
                                icon={Trash2}
                                label="Terminate Gym"
                                color="rose"
                                loading={actionLoading === "softDelete"}
                                onClick={() => setShowDeleteModal(true)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Feature Management */}
            <div className="glass-premium p-8 border-border bg-card dark:bg-slate-950/40 space-y-8 animate-fade-up">
                <div className="flex items-center gap-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Feature Management & Overrides</h3>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { key: "attendance", label: "Attendance Core" },
                        { key: "trainers", label: "Trainers/Staff" },
                        { key: "workoutPlans", label: "Workout Plans" },
                        { key: "payments", label: "Payments Registry" },
                        { key: "auditLogs", label: "Security Logs" },
                        { key: "multiBranch", label: "Multi-Branch Support" },
                    ].map((f) => {
                        const isEnabled = gym.modules?.[f.key] ?? true;
                        return (
                            <div 
                                key={f.key} 
                                className={cn(
                                    "p-4 rounded-xl border transition-all flex items-center justify-between group/feat text-slate-300",
                                    isEnabled 
                                        ? "bg-emerald-500/10 border-emerald-500/20" 
                                        : "bg-white/[0.02] border-white/5 text-slate-500"
                                )}
                            >
                                <span className={cn("text-[10px] font-black uppercase tracking-widest italic", isEnabled && "text-emerald-400")}>{f.label}</span>
                                <button
                                    onClick={() => doAction("toggleFeature", { featureKey: f.key })}
                                    disabled={actionLoading === "toggleFeature" || actionLoading !== ""}
                                    className={cn(
                                        "transition-all active:scale-90 outline-none",
                                        isEnabled ? "text-emerald-400" : "text-slate-600 hover:text-slate-400"
                                    )}
                                >
                                    {isEnabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Payment History */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-black italic tracking-tighter text-foreground uppercase flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Platform Payment History
                    </h3>
                    <div className="h-px flex-1 bg-black/5 dark:bg-white/5 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                </div>

                <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40 font-bold tracking-widest uppercase">
                    {platformPayments?.length === 0 ? (
                        <div className="p-12 text-center opacity-50 underline underline-offset-8 decoration-primary/30">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">No platform payments recorded for this instance</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px]">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02]">
                                        {["Amount", "Method", "Payment Date", "Expiry Date", "Notes"].map((h) => (
                                            <th key={h} className="px-6 py-6 text-left font-black text-slate-500 italic uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(platformPayments || []).map((p: any) => (
                                        <tr key={p._id} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                            <td className="px-6 py-6 text-emerald-400 font-black italic tracking-tighter text-base">{formatPKR(p.amountPKR)}</td>
                                            <td className="px-6 py-6 font-black italic tracking-widest text-[10px] text-foreground">
                                                <span className="bg-white/5 px-2 py-1 rounded">
                                                    {p.paymentMethod?.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-slate-500 font-mono text-[10px]">{new Date(p.paymentDate).toLocaleDateString("en-PK").toUpperCase()}</td>
                                            <td className="px-6 py-6 text-slate-500 font-mono text-[10px]">{new Date(p.expiryDate).toLocaleDateString("en-PK").toUpperCase()}</td>
                                            <td className="px-6 py-6 text-slate-400 font-medium italic normal-case text-xs lowercase max-w-[200px] truncate">{p.notes || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Extend Modal */}
            {showExtendModal && (
                <Modal onClose={() => setShowExtendModal(false)} title="Extend Subscription">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Days to Extend</label>
                            <input
                                type="number"
                                min="1"
                                value={extendDays}
                                onChange={(e) => setExtendDays(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setShowExtendModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    doAction("extend", { days: parseInt(extendDays) });
                                    setShowExtendModal(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                            >
                                Extend
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <Modal onClose={() => setShowPaymentModal(false)} title="Record Payment">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Amount (PKR)</label>
                            <input
                                type="number"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50"
                                placeholder="25000"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Payment Method</label>
                            <Select
                                value={paymentForm.method}
                                onValueChange={(value) => setPaymentForm({ ...paymentForm, method: value })}
                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] w-full text-slate-300 h-[38px]">
                                    <SelectValue placeholder="Select Method" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a24] border-white/[0.08] text-white z-[70] max-h-60 overflow-y-auto custom-scrollbar">
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="jazzcash">JazzCash</SelectItem>
                                    <SelectItem value="easypaisa">EasyPaisa</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">New Expiry Date</label>
                            <input
                                type="date"
                                value={paymentForm.expiryDate}
                                onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Notes</label>
                            <textarea
                                value={paymentForm.notes}
                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                            />
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentForm({ amount: "", method: "cash", notes: "", expiryDate: "" });
                                }}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    doAction("markPaid", {
                                        amount: parseInt(paymentForm.amount),
                                        method: paymentForm.method,
                                        notes: paymentForm.notes,
                                        expiryDate: paymentForm.expiryDate,
                                        planName: gym.plan?.name || "",
                                    });
                                    setShowPaymentModal(false);
                                    setPaymentForm({ amount: "", method: "cash", notes: "", expiryDate: "" });
                                }}
                                disabled={!paymentForm.amount || !paymentForm.expiryDate}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-40"
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Suspend Modal */}
            {showSuspendModal && (
                <Modal onClose={() => setShowSuspendModal(false)} title="Suspend Gym">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">Are you sure you want to suspend this gym? Please provide a reason.</p>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Reason</label>
                            <input
                                type="text"
                                value={suspensionReason}
                                onChange={(e) => setSuspensionReason(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-indigo-500/50"
                                placeholder="e.g. Payment overdue"
                            />
                        </div>
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={() => setShowSuspendModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (suspensionReason) {
                                        doAction("suspend", { reason: suspensionReason });
                                        setShowSuspendModal(false);
                                        setSuspensionReason("");
                                    } else {
                                        toast.error("Reason is required");
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                            >
                                Suspend Gym
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <Modal onClose={() => setShowDeleteModal(false)} title="Confirm Soft Delete">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">This will deactivate the gym. Are you sure you want to proceed?</p>
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await doAction("softDelete");
                                    setShowDeleteModal(false);
                                    router.push("/super-admin/gyms");
                                }}
                                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
                            >
                                Delete Gym
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Hard Delete Modal */}
            {showHardDeleteModal && (
                <Modal onClose={() => setShowHardDeleteModal(false)} title="Permanently Delete Gym">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Warning: This action cannot be undone</p>
                        <p className="text-sm text-slate-300">This will completely delete the gym and <strong className="text-white">all</strong> of its associated user accounts, members, payments, and subscriptions from the database permanently.</p>
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={() => setShowHardDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await doAction("hardDelete");
                                    setShowHardDeleteModal(false);
                                    router.push("/super-admin/gyms");
                                }}
                                disabled={actionLoading === "hardDelete"}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {actionLoading === "hardDelete" ? "Deleting..." : "Delete Permanently"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <Modal onClose={() => setShowResetPasswordModal(false)} title="Reset Owner Password">
                    <div className="space-y-4">
                        <p className="text-sm text-slate-300">Are you sure you want to reset the owner's password to <strong className="text-white">password123</strong>?</p>
                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                onClick={() => setShowResetPasswordModal(false)}
                                className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    doAction("resetPassword", { newPassword: "password123" });
                                    setShowResetPasswordModal(false);
                                }}
                                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                            >
                                Reset Password
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            <EditGymModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={fetchGym}
                gym={gym}
            />
        </div>
    );
}

// Helper Components
function InfoRow({ icon: Icon, label, value, highlight, error }: any) {
    return (
        <div className="flex items-start gap-4 group/info">
            <div className={cn(
                "w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 transition-colors group-hover/info:bg-white/10",
                error ? "text-red-400 border-red-500/20" : highlight ? "text-primary border-primary/20" : "text-slate-500"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{label}</p>
                <p className={cn(
                    "text-base font-black italic tracking-tighter truncate uppercase",
                    error ? "text-red-400" : highlight ? "text-primary" : "text-foreground"
                )}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon }: any) {
    return (
        <div className="glass-premium bg-white/5 border border-white/5 p-6 text-center group/stat hover:bg-white/10 transition-all cursor-default">
            <Icon className="w-5 h-5 text-slate-500 mx-auto mb-2 group-hover/stat:text-primary transition-colors" />
            <p className="text-2xl font-black italic tracking-tighter text-foreground uppercase truncate group-hover/stat:scale-110 transition-transform duration-300">{value}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mt-1">{label}</p>
        </div>
    );
}

function ActionButton({ icon: Icon, label, color, loading, onClick }: any) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white",
        red: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500 hover:text-white",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-white",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500 hover:text-white",
        green: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-white",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white",
    };

    return (
        <Button
            onClick={onClick}
            disabled={loading}
            variant="ghost"
            className={cn(
                "h-11 flex items-center gap-3 px-6 rounded-xl border text-[10px] font-black italic tracking-widest uppercase transition-all shadow-lg active:scale-95",
                colors[color] || colors.blue,
                loading && "opacity-50 cursor-not-allowed"
            )}
        >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
            {label}
        </Button>
    );
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-[#111118] border border-white/[0.08] rounded-xl p-6 w-full max-w-md shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-semibold text-white mb-4 pr-6">{title}</h3>
                {children}
            </div>
        </div>
    );
}
