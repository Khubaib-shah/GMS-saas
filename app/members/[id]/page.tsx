"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import type { Payment } from "@/lib/types";
import Link from "next/link";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  CreditCard, 
  History, 
  Trash2, 
  Edit,
  Clock,
  ShieldCheck,
  Plus,
  Pause,
  Play,
  Camera,
  Upload,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, isSubscriptionActive } from "@/lib/utils/file-utils";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memberId } = use(params);
  const router = useRouter();

  const {
    members,
    gymProfile,
    subscriptions,
    payments,
    plans,
    loadMembers,
    loadSubscriptions,
    loadPayments,
    loadPlans,
    deleteMember,
    renewSubscription,
    updateSubscription,
    deleteSubscription,
    updatePayment,
    deletePayment,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [renewDays, setRenewDays] = useState(30);
  const [renewMethod, setRenewMethod] = useState<"cash" | "online">("cash");
  const [renewReceipt, setRenewReceipt] = useState<string | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  
  // Payment Edit/Delete State
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [paymentEditData, setPaymentEditData] = useState<{
    amount: number;
    method: "cash" | "online";
    date: string;
    description: string;
    receiptUrl?: string | null;
  }>({
    amount: 0,
    method: "cash",
    date: "",
    description: "",
    receiptUrl: null,
  });

  useEffect(() => {
    if (selectedPlan) {
      const plan = plans.find(p => p.id === selectedPlan);
      if (plan) setRenewDays(plan.duration);
    }
  }, [selectedPlan, plans]);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        loadMembers(),
        loadSubscriptions(),
        loadPayments(),
        loadPlans()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const member = useMemo(() => 
    members.find((m) => m.id === memberId),
    [members, memberId]
  );
  
  useEffect(() => {
    if (member?.planId && !selectedPlan) {
      setSelectedPlan(member.planId);
    }
  }, [member]);

  const memberSubs = useMemo(() => 
    [...subscriptions]
      .filter((s) => s.memberId === memberId)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [subscriptions, memberId]
  );

  const memberPayments = useMemo(() => 
    [...payments]
      .filter((p) => p.memberId === memberId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [payments, memberId]
  );

  const activeSub = memberSubs.find(s => isSubscriptionActive(s.endDate, s.status));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading member profile...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container max-w-2xl py-20">
        <Card className="p-12 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Member Not Found</h2>
          <p className="text-muted-foreground mb-8 text-balance">The member you are looking for does not exist or has been removed from the registry.</p>
          <Button asChild size="lg">
            <Link href="/members">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Members
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    await deleteMember(memberId);
    toast.success("Member record removed successfully");
    router.push("/members");
  };

  const handleDeleteSubscription = async () => {
    if (!deleteSubId) return;
    await deleteSubscription(deleteSubId);
    toast.success("Subscription and associated payment removed");
    setDeleteSubId(null);
  };

  const handleOpenEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentEditData({
      amount: payment.amount,
      method: payment.method || "online",
      date: payment.date,
      description: payment.description || "",
      receiptUrl: payment.receiptUrl || null,
    });
    setIsEditPaymentModalOpen(true);
  };

  const handleSavePayment = async () => {
    if (!editingPayment) return;
    try {
      toast.loading("Updating payment...", { id: "edit-payment" });
      await updatePayment(editingPayment.id, paymentEditData);
      toast.success("Payment record updated", { id: "edit-payment" });
      setIsEditPaymentModalOpen(false);
      setEditingPayment(null);
    } catch (error) {
      toast.error("Failed to update payment", { id: "edit-payment" });
    }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      toast.loading("Deleting payment...", { id: "delete-payment" });
      await deletePayment(deletePaymentId);
      toast.success("Payment record removed", { id: "delete-payment" });
    } catch (error) {
      toast.error("Failed to delete payment", { id: "delete-payment" });
    } finally {
      setDeletePaymentId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("File is too large (max 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRenew = async () => {
    if (!selectedPlan) {
      toast.error("Please select a plan for renewal");
      return;
    }

    if (renewMethod === "online" && !renewReceipt) {
      toast.error("Receipt image is required for online payments");
      return;
    }

    try {
      toast.loading("Processing renewal...", { id: "renewal" });
      const success = await renewSubscription(memberId, selectedPlan, renewDays, renewMethod, renewReceipt || undefined);
      if (success) {
        toast.success("Subscription successfully extended", { id: "renewal" });
        setRenewReceipt(null);
        loadSubscriptions();
        loadPayments();
      } else {
        toast.error("Could not complete renewal", { id: "renewal" });
      }
    } catch (error) {
      toast.error("An error occurred during renewal", { id: "renewal" });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild className="-ml-4 text-muted-foreground hover:text-foreground">
          <Link href="/members">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Registry
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/members/${memberId}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeletingMember(true)} className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-xl shadow-foreground/[0.03]">
            <div className="relative h-32 bg-gradient-to-br from-primary/80 to-primary">
               {/* Pattern Overlay */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            </div>
            <div className="px-6 pb-8">
              <div className="relative flex justify-center -mt-16 mb-4">
                {member.photoBase64 ? (
                  <img
                    src={member.photoBase64}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-background shadow-2xl shadow-foreground/20 bg-muted"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-secondary border-4 border-background shadow-2xl flex items-center justify-center text-muted-foreground font-bold text-3xl">
                    {member.firstName[0]}{member.lastName?.[0]}
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-lg transform translate-x-1/4",
                  activeSub ? "bg-emerald-500" : "bg-destructive"
                )}>
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">{member.firstName} {member.lastName}</h1>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted/50 inline-block">
                  {(member.planId || "No Plan").replace("plan_", "").toUpperCase()}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Email</p>
                    <p className="font-medium truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Phone</p>
                    <p className="font-medium">{member.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-muted/30 border border-border/40">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-primary/70" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Joined</p>
                    <p className="font-medium">{formatDate(member.joinDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats / Action Card */}
          <Card className="p-6 border-none shadow-xl shadow-foreground/[0.03] space-y-6">
            <h3 className="font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Manage Subscription
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1">Target Plan</label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                >
                  <option value="">Choose a plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1">Duration (Days)</label>
                <div className="relative">
                   <input
                    type="number"
                    className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-12"
                    value={renewDays}
                    onChange={(e) => setRenewDays(Number(e.target.value))}
                    placeholder="Days"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">DAYS</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1">Payment Method</label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-lg border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value as any)}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {renewMethod === "online" && (
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1 flex items-center gap-1">
                    Receipt Required <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  </label>
                  <div className="space-y-3">
                    {renewReceipt ? (
                      <div className="relative group rounded-xl overflow-hidden border bg-muted/20">
                        <img src={renewReceipt} alt="Receipt" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="h-8 rounded-full"
                            onClick={() => setRenewReceipt(null)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          type="button"
                          className="h-20 flex-col gap-2 rounded-xl border-dashed hover:bg-primary/5 hover:border-primary/50 transition-all"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.capture = 'environment';
                            input.onchange = (e) => handleFileChange(e as any, setRenewReceipt);
                            input.click();
                          }}
                        >
                          <Camera className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Take Photo</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          type="button"
                          className="h-20 flex-col gap-2 rounded-xl border-dashed hover:bg-primary/5 hover:border-primary/50 transition-all"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleFileChange(e as any, setRenewReceipt);
                            input.click();
                          }}
                        >
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Upload File</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Button className="w-full shadow-lg shadow-primary/20" onClick={handleRenew}>
                <Plus className="w-4 h-4 mr-2" />
                Extend Membership
              </Button>
              
              {activeSub && (
                <p className="text-[11px] text-center text-muted-foreground italic">
                  New sub will start on {formatDate(activeSub.endDate)}
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Detailed History */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Status Banner */}
          <Card className={cn(
            "p-6 border-l-4 shadow-lg shadow-foreground/[0.02] flex items-center justify-between",
            activeSub ? "border-l-emerald-500 bg-emerald-50/10" : "border-l-destructive bg-destructive/5"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                activeSub ? "bg-emerald-100 text-emerald-600" : "bg-destructive/10 text-destructive"
              )}>
                {activeSub ? <CreditCard className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-foreground">
                  {activeSub ? "Currently Active" : "Membership Expired"}
                </h4>
                <p className="text-sm text-muted-foreground leading-none mt-1">
                  {activeSub 
                    ? `Expiring on ${formatDate(activeSub.endDate)}` 
                    : `Last active on ${memberSubs[0] ? formatDate(memberSubs[0].endDate) : 'never'}`}
                </p>
              </div>
            </div>
            {!activeSub && (
              <span className="animate-pulse flex items-center gap-1 text-xs font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-3 py-1 rounded-full">
                Renewal Needed
              </span>
            )}
          </Card>

          {/* Subscriptions History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Membership Timeline
            </h3>
            
            <div className="space-y-3">
              {memberSubs.length > 0 ? (
                memberSubs.map((sub, idx) => {
                  const isActive = isSubscriptionActive(sub.endDate, sub.status);
                  const planName = plans.find(p => p.id === sub.planId)?.name || sub.planId;
                  return (
                    <div key={sub.id} className="group relative flex items-start gap-4 p-4 rounded-2xl border bg-background hover:shadow-md transition-all">
                      <div className={cn(
                        "mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors",
                        isActive && sub.status !== "paused" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                        sub.status === "paused" && "bg-amber-100 text-amber-600"
                      )}>
                        {sub.status === "paused" ? <Pause className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold truncate">{planName}</h5>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md",
                              sub.status === "paused" ? "bg-amber-100 text-amber-700" :
                              isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                            )}>
                              {sub.status === "paused" ? "Paused" : isActive ? 'Current' : 'Completed'}
                            </span>
                            
                            {/* Management Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              {isActive && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 rounded-md hover:bg-amber-100 hover:text-amber-600"
                                  title={sub.status === "paused" ? "Resume Membership" : "Pause Membership"}
                                  onClick={() => updateSubscription(sub.id, { status: sub.status === "paused" ? "active" : "paused" })}
                                >
                                  {sub.status === "paused" ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                title="Delete Subscription"
                                onClick={() => setDeleteSubId(sub.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                             <Calendar className="w-3 h-3" />
                             {formatDate(sub.startDate)} - {formatDate(sub.endDate)}
                          </span>
                          <span className="flex items-center gap-1">
                             <Clock className="w-3 h-3" />
                             {Math.ceil((new Date(sub.endDate).getTime() - new Date(sub.startDate).getTime()) / 86400000)} Days
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center rounded-3xl border border-dashed bg-muted/20">
                   <p className="text-muted-foreground text-sm italic">No subscription history found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Payments History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              Payment Records
            </h3>
            
            <Card className="overflow-hidden border-none shadow-xl shadow-foreground/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Transaction ID</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Method</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right relative min-w-[100px]">Amount</th>
                      <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberPayments.length > 0 ? (
                      memberPayments.map((pay) => (
                        <tr key={pay.id} className="border-b transition-colors hover:bg-muted/5 group">
                          <td className="px-6 py-4 font-medium text-muted-foreground flex items-center gap-2">
                            {pay.id.slice(-8).toUpperCase()}
                            {pay.receiptUrl && (
                              <button 
                                onClick={() => setPreviewReceiptUrl(pay.receiptUrl || null)}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                                title="View Receipt"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold">{formatDate(pay.date)}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-full bg-secondary text-primary text-[10px] font-bold uppercase">
                              {pay.method || "Cash"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-foreground">
                            {formatCurrency(pay.amount)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleOpenEditPayment(pay)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setDeletePaymentId(pay.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic bg-muted/10">
                          No payment history recorded for this member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Member Confirmation */}
      <AlertDialog open={isDeletingMember} onOpenChange={setIsDeletingMember}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member Profile?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{member?.firstName} {member?.lastName}</strong> and all their associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Subscription Confirmation */}
      <AlertDialog open={deleteSubId !== null} onOpenChange={(open) => !open && setDeleteSubId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this specific membership period and its <strong>associated payment record</strong>. This may affect the member's current status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubscription} className="bg-destructive hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Payment Confirmation */}
      <AlertDialog open={deletePaymentId !== null} onOpenChange={(open) => !open && setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This will <strong>NOT</strong> affect the member's subscription status, but it will be removed from all financial totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Payment Modal */}
      <Dialog open={isEditPaymentModalOpen} onOpenChange={setIsEditPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
            <DialogDescription>
              Correct transaction details for this record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount ({gymProfile.name})</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="edit-amount"
                    type="number"
                    value={paymentEditData.amount}
                    className="pl-9"
                    onChange={(e) => setPaymentEditData({ ...paymentEditData, amount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-method">Method</Label>
                <select
                  id="edit-method"
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={paymentEditData.method}
                  onChange={(e) => setPaymentEditData({ ...paymentEditData, method: e.target.value as any })}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Transaction Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="edit-date"
                  type="date"
                  className="pl-9"
                  value={paymentEditData.date ? new Date(paymentEditData.date).toISOString().split('T')[0] : ""}
                  onChange={(e) => setPaymentEditData({ ...paymentEditData, date: new Date(e.target.value).toISOString() })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Input
                id="edit-desc"
                placeholder="e.g. Monthly Renewal"
                value={paymentEditData.description}
                onChange={(e) => setPaymentEditData({ ...paymentEditData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">Receipt / Proof</span>
                {paymentEditData.receiptUrl && (
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-[10px] text-primary hover:no-underline"
                    onClick={() => setPreviewReceiptUrl(paymentEditData.receiptUrl || null)}
                  >
                    <Eye className="w-3 h-3 mr-1" /> View Original
                  </Button>
                )}
              </Label>
              <div className="space-y-3">
                {paymentEditData.receiptUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border bg-muted/20">
                    <img src={paymentEditData.receiptUrl} alt="Receipt" className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-8 rounded-full"
                        onClick={() => setPaymentEditData({ ...paymentEditData, receiptUrl: null })}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      type="button"
                      className="h-16 flex-col gap-1.5 rounded-xl border-dashed hover:bg-primary/5 transition-all"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => handleFileChange(e as any, (val) => setPaymentEditData({ ...paymentEditData, receiptUrl: val || undefined }));
                        input.click();
                      }}
                    >
                      <Camera className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Camera</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      type="button"
                      className="h-16 flex-col gap-1.5 rounded-xl border-dashed hover:bg-primary/5 transition-all"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleFileChange(e as any, (val) => setPaymentEditData({ ...paymentEditData, receiptUrl: val || undefined }));
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gallery</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPaymentModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePayment} className="bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Preview Modal */}
      <Dialog open={previewReceiptUrl !== null} onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-transparent shadow-none">
          <div className="relative group flex items-center justify-center p-4">
            <img 
              src={previewReceiptUrl || ""} 
              alt="Receipt Preview" 
              className="w-full h-auto max-h-[90vh] object-contain rounded-2xl shadow-2xl border bg-background" 
            />
          
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
