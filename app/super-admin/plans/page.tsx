"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Edit2,
    Save,
    X,
    CreditCard,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Check,
    DollarSign,
    Square,
    CheckSquare,
    AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Layers } from "lucide-react";

function formatPKR(amount: number) {
    return `₨ ${amount.toLocaleString("en-PK")}`;
}

const FEATURE_OPTIONS = [
    "members", "subscriptions", "payments", "attendance",
    "trainersModule", "advancedReports", "dietModule",
    "branches", "multipleTrainers", "workoutPlanner",
    "memberPortal", "api_access",
];

const emptyPlan = {
    name: "",
    monthlyPricePKR: "",
    yearlyPricePKR: "",
    branchLimit: 1,
    maxStaffAccounts: 5,
    maxTrainers: 2,
    trialDays: 14,
    featureFlags: ["members", "subscriptions", "payments", "attendance"],
    description: "",
};

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<any>({ ...emptyPlan });
    const [saving, setSaving] = useState(false);
    const [toggleConfirm, setToggleConfirm] = useState<any>(null);

    const fetchPlans = async () => {
        try {
            const res = await fetch("/api/super-admin/plans");
            const data = await res.json();
            setPlans(data.plans || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.monthlyPricePKR) {
            toast.error("Name and Monthly Price are required");
            return;
        }
        setSaving(true);
        try {
            const url = editingId
                ? `/api/super-admin/plans/${editingId}`
                : "/api/super-admin/plans";
            const method = editingId ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    monthlyPricePKR: parseInt(form.monthlyPricePKR),
                    yearlyPricePKR: form.yearlyPricePKR ? parseInt(form.yearlyPricePKR) : null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success(editingId ? "Plan updated" : "Plan created");
            setShowForm(false);
            setEditingId(null);
            setForm({ ...emptyPlan });
            await fetchPlans();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    const togglePlan = async (id: string) => {
        try {
            const res = await fetch(`/api/super-admin/plans/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success(data.message);
            await fetchPlans();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const startEdit = (plan: any) => {
        setForm({
            name: plan.name,
            monthlyPricePKR: plan.monthlyPricePKR?.toString() || "",
            yearlyPricePKR: plan.yearlyPricePKR?.toString() || "",
            branchLimit: plan.branchLimit || 1,
            maxStaffAccounts: plan.maxStaffAccounts || 5,
            maxTrainers: plan.maxTrainers || 2,
            trialDays: plan.trialDays || 14,
            featureFlags: plan.featureFlags || [],
            description: plan.description || "",
        });
        setEditingId(plan._id || plan.id);
        setShowForm(true);
    };

    const toggleFeature = (feature: string) => {
        setForm((prev: any) => ({
            ...prev,
            featureFlags: prev.featureFlags.includes(feature)
                ? prev.featureFlags.filter((f: string) => f !== feature)
                : [...prev.featureFlags, feature],
        }));
    };

    const handleSelectAll = (select: boolean) => {
        setForm((prev: any) => ({
            ...prev,
            featureFlags: select ? [...FEATURE_OPTIONS] : []
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <DashboardHeader
                title="PLATFORM"
                highlight="PLANS"
                subtitle="ADMIN: SUBSCRIPTION_MODELS_v2"
                description="Configure pricing and feature tiers for gyms."
            >
                {!showForm && (
                    <button
                        onClick={() => {
                            setForm({ ...emptyPlan });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="h-[38px] flex justify-center items-center px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group gap-2"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        NEW PLAN
                    </button>
                )}
            </DashboardHeader>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="rounded-2xl border border-indigo-500/20 bg-[#0d0d14]/80 backdrop-blur-xl p-8 space-y-6 shadow-[0_0_50px_rgba(99,102,241,0.1)] relative overflow-hidden group/form">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] to-transparent pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                            {editingId ? "Edit Plan" : "Create New Plan"}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                            <X className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="Plan Name" required>
                            <input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="e.g. Single Branch Plan"
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Monthly Price (PKR)" required>
                            <input
                                type="number"
                                value={form.monthlyPricePKR}
                                onChange={(e) => setForm({ ...form, monthlyPricePKR: e.target.value })}
                                placeholder="25000"
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Yearly Price (PKR)">
                            <input
                                type="number"
                                value={form.yearlyPricePKR}
                                onChange={(e) => setForm({ ...form, yearlyPricePKR: e.target.value })}
                                placeholder="250000"
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Branch Limit">
                            <input
                                type="number"
                                min="1"
                                value={form.branchLimit}
                                onChange={(e) => setForm({ ...form, branchLimit: parseInt(e.target.value) || 1 })}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Max Staff Accounts">
                            <input
                                type="number"
                                min="1"
                                value={form.maxStaffAccounts}
                                onChange={(e) => setForm({ ...form, maxStaffAccounts: parseInt(e.target.value) || 5 })}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Max Trainers">
                            <input
                                type="number"
                                min="1"
                                value={form.maxTrainers}
                                onChange={(e) => setForm({ ...form, maxTrainers: parseInt(e.target.value) || 2 })}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Trial Days">
                            <input
                                type="number"
                                min="0"
                                value={form.trialDays}
                                onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value) || 0 })}
                                className="form-input"
                            />
                        </FormField>
                        <FormField label="Feature Access">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="form-input flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-indigo-400" />
                                            <span className="text-xs font-bold uppercase tracking-tight py-px">
                                                {form.featureFlags.length === FEATURE_OPTIONS.length
                                                    ? "ALL FEATURES ENABLED"
                                                    : `${form.featureFlags.length} FEATURES ACTIVE`}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[300px] bg-[#0d0d14] border-white/[0.08] shadow-2xl rounded-xl p-2" align="start">
                                    <DropdownMenuLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1">
                                        System Capabilities
                                    </DropdownMenuLabel>
                                    <DropdownMenuItem
                                        onClick={() => handleSelectAll(form.featureFlags.length !== FEATURE_OPTIONS.length)}
                                        className="text-xs font-bold text-indigo-400 focus:text-indigo-300 transition-colors flex items-center gap-2"
                                    >
                                        {form.featureFlags.length === FEATURE_OPTIONS.length ? (
                                            <>
                                                <Square className="w-3.5 h-3.5" />
                                                DESELECT ALL
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="w-3.5 h-3.5" />
                                                SELECT ALL CAPABILITIES
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/[0.06]" />
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {FEATURE_OPTIONS.map((f) => (
                                            <DropdownMenuCheckboxItem
                                                key={f}
                                                checked={form.featureFlags.includes(f)}
                                                onCheckedChange={() => toggleFeature(f)}
                                                onSelect={(e) => e.preventDefault()}
                                                className="text-xs capitalize py-2 focus:bg-white/[0.04]"
                                            >
                                                {f.replace(/([A-Z])/g, ' $1').trim()}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </FormField>

                        <div className="md:col-span-4">
                            <FormField label="Description">
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={2}
                                    placeholder="Plan description..."
                                    className="form-input resize-none"
                                />
                            </FormField>
                        </div>
                    </div>



                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => { setShowForm(false); setEditingId(null); }}
                            className="px-4 py-2 rounded-lg bg-white/[0.04] text-slate-400 text-sm hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {plans.length === 0 && !loading
                    ? (
                        <div className="col-span-full text-center py-16">
                            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400">No plans created yet</p>
                            <p className="text-xs text-slate-500 mt-1">Create your first platform plan above</p>
                        </div>
                    )
                    : plans.map((plan) => (
                        <div
                            key={plan._id || plan.id}
                            className={cn(
                                "rounded-xl border bg-[#0d0d14] p-5 space-y-4 transition-all",
                                plan.isActive
                                    ? "border-white/[0.06] hover:border-indigo-500/30"
                                    : "border-white/[0.04] opacity-60"
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-white">{plan.name}</h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{plan.description || "No description"}</p>
                                </div>
                                <span
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                        plan.isActive
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : "bg-slate-500/10 text-slate-400"
                                    )}
                                >
                                    {plan.isActive ? "Active" : "Inactive"}
                                </span>
                            </div>

                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-indigo-400">
                                    {formatPKR(plan.monthlyPricePKR)}
                                </span>
                                <span className="text-xs text-slate-500">/month</span>
                            </div>
                            {plan.yearlyPricePKR && (
                                <p className="text-xs text-slate-400">
                                    Yearly: {formatPKR(plan.yearlyPricePKR)}
                                </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-white/[0.03] p-2">
                                    <p className="text-sm font-bold text-white">{plan.branchLimit}</p>
                                    <p className="text-[10px] text-slate-500">Branches</p>
                                </div>
                                <div className="rounded-lg bg-white/[0.03] p-2">
                                    <p className="text-sm font-bold text-white">{plan.maxStaffAccounts}</p>
                                    <p className="text-[10px] text-slate-500">Staff</p>
                                </div>
                                <div className="rounded-lg bg-white/[0.03] p-2">
                                    <p className="text-sm font-bold text-white">{plan.trialDays}d</p>
                                    <p className="text-[10px] text-slate-500">Trial</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {(plan.featureFlags || []).slice(0, 4).map((f: string) => (
                                    <span key={f} className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400">
                                        {f}
                                    </span>
                                ))}
                                {(plan.featureFlags?.length || 0) > 4 && (
                                    <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-500">
                                        +{plan.featureFlags.length - 4} more
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                                <button
                                    onClick={() => startEdit(plan)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-slate-400 hover:text-white transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button
                                    onClick={() => setToggleConfirm(plan)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                                        plan.isActive
                                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                            : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    )}
                                >
                                    {plan.isActive ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                                    {plan.isActive ? "Deactivate" : "Activate"}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={!!toggleConfirm} onOpenChange={() => setToggleConfirm(null)}>
                <AlertDialogContent className="bg-[#0d0d14] border-white/[0.08] shadow-2xl rounded-2xl p-6">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                                "p-2 rounded-lg",
                                toggleConfirm?.isActive ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                            )}>
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <AlertDialogTitle className="text-white font-bold tracking-tight">
                                {toggleConfirm?.isActive ? "Confirm Deactivation" : "Confirm Activation"}
                            </AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-slate-400 text-sm">
                            Are you sure you want to {toggleConfirm?.isActive ? "deactivate" : "activate"} the <span className="text-white font-bold">{toggleConfirm?.name}</span> plan?
                            {toggleConfirm?.isActive
                                ? " This will prevent new gyms from subscribing to this tier."
                                : " This will make the plan available for new registrations."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="bg-white/[0.04] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-all">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                togglePlan(toggleConfirm?._id || toggleConfirm?.id);
                                setToggleConfirm(null);
                            }}
                            className={cn(
                                "rounded-xl font-bold uppercase tracking-widest text-[10px] px-6 transition-all",
                                toggleConfirm?.isActive
                                    ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            )}
                        >
                            Confirm Action
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <style jsx>{`
                .form-input {
                    width: 100%;
                    padding: 0.65rem 1rem;
                    border-radius: 0.75rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                    font-size: 0.875rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .form-input:focus {
                    border-color: rgba(99, 102, 241, 0.6);
                    background: rgba(99, 102, 241, 0.05);
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
                }
                .form-input::placeholder {
                    color: rgba(148, 163, 184, 0.4);
                    font-weight: 400;
                }
                .custom-scrollbar::-webkit-scrollbar {
                  width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            {children}
        </div>
    );
}
