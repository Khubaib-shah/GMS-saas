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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Platform Plans</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage subscription plans for gyms</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => {
                            setForm({ ...emptyPlan });
                            setEditingId(null);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Create Plan
                    </button>
                )}
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="rounded-xl border border-indigo-500/20 bg-[#0d0d14] p-6 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                            {editingId ? "Edit Plan" : "Create New Plan"}
                        </h3>
                        <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                            <X className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <div className="md:col-span-2">
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

                    {/* Feature Flags */}
                    <div>
                        <p className="text-xs text-slate-400 font-medium mb-2">Feature Access</p>
                        <div className="flex flex-wrap gap-2">
                            {FEATURE_OPTIONS.map((f) => (
                                <button
                                    key={f}
                                    onClick={() => toggleFeature(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                        form.featureFlags.includes(f)
                                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                            : "bg-white/[0.02] text-slate-500 border-white/[0.06] hover:border-white/[0.12]"
                                    )}
                                >
                                    {form.featureFlags.includes(f) && <Check className="w-3 h-3 inline mr-1" />}
                                    {f}
                                </button>
                            ))}
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

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-[280px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                    ))
                    : plans.length === 0
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
                                    {(plan.featureFlags || []).slice(0, 5).map((f: string) => (
                                        <span key={f} className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-400">
                                            {f}
                                        </span>
                                    ))}
                                    {(plan.featureFlags?.length || 0) > 5 && (
                                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] text-slate-500">
                                            +{plan.featureFlags.length - 5} more
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
                                        onClick={() => togglePlan(plan._id || plan.id)}
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

            <style jsx>{`
                .form-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border-radius: 0.5rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: white;
                    font-size: 0.875rem;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .form-input:focus {
                    border-color: rgba(99, 102, 241, 0.5);
                }
                .form-input::placeholder {
                    color: rgba(148, 163, 184, 0.5);
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
