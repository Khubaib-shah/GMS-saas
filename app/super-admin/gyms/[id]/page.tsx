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
        <div className="space-y-6">
            {/* Back + Title */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push("/super-admin/gyms")}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-white">{gym.name}</h1>
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="p-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                            title="Edit Gym Info"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", badge.cls)}>
                            {badge.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {gym.id}</p>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Basic Info</h3>
                    <div className="space-y-3">
                        <InfoRow icon={Building2} label="Gym Name" value={gym.name} />
                        <InfoRow icon={User} label="Owner" value={owner?.name || "N/A"} />
                        <InfoRow icon={Mail} label="Email" value={owner?.email || "N/A"} />
                        <InfoRow icon={Phone} label="Phone" value={gym.phone || owner?.phone || "N/A"} />
                        <InfoRow icon={MapPin} label="Address" value={gym.address || "N/A"} />
                        <InfoRow icon={MapPin} label="City" value={gym.city || "N/A"} />
                        <InfoRow icon={Calendar} label="Registered" value={new Date(gym.createdAt).toLocaleDateString("en-PK")} />
                    </div>
                </div>

                {/* Subscription Info */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscription</h3>
                    <div className="space-y-3">
                        <InfoRow icon={CreditCard} label="Plan" value={gym.plan?.name || "No Plan"} highlight />
                        <InfoRow icon={DollarSign} label="Price" value={gym.plan ? formatPKR(gym.plan.monthlyPricePKR) + "/mo" : "—"} />
                        <InfoRow icon={Calendar} label="Expiry" value={gym.expiryDate ? new Date(gym.expiryDate).toLocaleDateString("en-PK") : "—"} />
                        <InfoRow icon={Clock} label="Trial Ends" value={gym.trialEndsAt ? new Date(gym.trialEndsAt).toLocaleDateString("en-PK") : "—"} />
                        <InfoRow icon={DollarSign} label="Outstanding" value={formatPKR(gym.outstandingAmount)} highlight={gym.outstandingAmount > 0} />
                        {gym.isSuspended && (
                            <InfoRow icon={Ban} label="Reason" value={gym.suspensionReason || "N/A"} error />
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5 space-y-4">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statistics</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard label="Total Members" value={stats.totalMembers} icon={Users} />
                        <StatCard label="Active Members" value={stats.activeMembers} icon={Activity} />
                        <StatCard label="Trainers" value={stats.trainersCount} icon={User} />
                        <StatCard label="Branches" value={stats.branchCount} icon={Building2} />
                    </div>
                    <div className="pt-3 border-t border-white/[0.06]">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Total Gym Revenue</p>
                        <p className="text-xl font-bold text-emerald-400">{formatPKR(stats.totalRevenue)}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Gym Actions</h3>
                <div className="flex flex-wrap gap-3">
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
                                    label="Activate"
                                    color="emerald"
                                    loading={actionLoading === "activate"}
                                    onClick={() => doAction("activate")}
                                />
                            )}
                            {!gym.isSuspended ? (
                                <ActionButton
                                    icon={Ban}
                                    label="Suspend"
                                    color="red"
                                    loading={actionLoading === "suspend"}
                                    onClick={() => setShowSuspendModal(true)}
                                />
                            ) : (
                                <ActionButton
                                    icon={ShieldOff}
                                    label="Unsuspend"
                                    color="amber"
                                    loading={actionLoading === "unsuspend"}
                                    onClick={() => doAction("unsuspend")}
                                />
                            )}
                            <ActionButton
                                icon={Clock}
                                label="Extend Subscription"
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
                                label="Reset Owner Password"
                                color="amber"
                                loading={actionLoading === "resetPassword"}
                                onClick={() => setShowResetPasswordModal(true)}
                            />

                            <div className="w-[200px]">
                                <Select
                                    value={gym.plan?.id || ""}
                                    onValueChange={(value) => {
                                        if (value && value !== (gym.plan?.id || "")) {
                                            doAction("changePlan", { planId: value });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] h-[34px] px-3 w-full text-slate-300 text-sm">
                                        <SelectValue placeholder="Change Plan..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1a1a24] border-white/[0.08] text-white z-[70] max-h-60 overflow-y-auto custom-scrollbar">
                                        {plans.map((p: any) => (
                                            <SelectItem key={p._id || p.id} value={p._id || p.id}>
                                                {p.name} — {formatPKR(p.monthlyPricePKR)}/mo
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <ActionButton
                                icon={Trash2}
                                label="Soft Delete"
                                color="rose"
                                loading={actionLoading === "softDelete"}
                                onClick={() => setShowDeleteModal(true)}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Payment History */}
            <div className="rounded-xl border border-white/[0.06] bg-[#0d0d14] p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Platform Payment History</h3>
                {platformPayments?.length === 0 ? (
                    <p className="text-sm text-slate-500">No platform payments recorded</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    {["Amount", "Method", "Payment Date", "Expiry Date", "Notes"].map((h) => (
                                        <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(platformPayments || []).map((p: any) => (
                                    <tr key={p._id} className="border-b border-white/[0.04]">
                                        <td className="px-3 py-2.5 text-emerald-400 font-medium">{formatPKR(p.amountPKR)}</td>
                                        <td className="px-3 py-2.5 text-slate-300 capitalize">{p.paymentMethod?.replace("_", " ")}</td>
                                        <td className="px-3 py-2.5 text-slate-400">{new Date(p.paymentDate).toLocaleDateString("en-PK")}</td>
                                        <td className="px-3 py-2.5 text-slate-400">{new Date(p.expiryDate).toLocaleDateString("en-PK")}</td>
                                        <td className="px-3 py-2.5 text-slate-500 text-xs">{p.notes || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
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
                <Modal onClose={() => setShowHardDeleteModal(false)} title="Confirm Permanent Delete">
                    <div className="space-y-4">
                        <p className="text-sm font-bold text-red-500 uppercase tracking-wider">Warning: Irreversible Action</p>
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
        <div className="flex items-start gap-3">
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", error ? "text-red-400" : "text-slate-500")} />
            <div className="min-w-0">
                <p className="text-[11px] text-slate-500">{label}</p>
                <p className={cn("text-sm font-medium truncate", error ? "text-red-400" : highlight ? "text-indigo-400" : "text-white")}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon }: any) {
    return (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <Icon className="w-4 h-4 text-slate-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        </div>
    );
}

function ActionButton({ icon: Icon, label, color, loading, onClick }: any) {
    const colors: Record<string, string> = {
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
    };

    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                colors[color] || colors.blue,
                loading && "opacity-50 cursor-not-allowed"
            )}
        >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
            {label}
        </button>
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
