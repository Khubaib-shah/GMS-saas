"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import type { Payment, Member } from "@/lib/types";
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
  Eye,
  Dumbbell,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
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
import { InputField } from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate, isSubscriptionActive } from "@/lib/utils/file-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: memberId } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

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
    workoutPlans,
    loadWorkoutPlans,
    assignWorkoutToMember,
    businessSettings,
    loadBusinessSettings,
    restoreMember
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [renewDays, setRenewDays] = useState(30);
  const [renewMethod, setRenewMethod] = useState<"cash" | "online" | "bank_transfer" | "card" | "other">("cash");
  const [renewReceipt, setRenewReceipt] = useState<string | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [fallbackMember, setFallbackMember] = useState<Member | null>(null);

  // Payment Edit/Delete State
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [paymentEditData, setPaymentEditData] = useState<{
    amount: number;
    method: "cash" | "online" | "bank_transfer" | "card" | "other";
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
        loadPlans(),
        loadWorkoutPlans(),
        loadBusinessSettings()
      ]);

      // Fallback: If member not found in store, try fetching individually
      // (This handles cases where the global list might be incomplete or pagination is introduced)
      const currentMembers = useAppStore.getState().members;
      if (!currentMembers.find(m => m.id === memberId)) {
        try {
          const res = await fetch(`/api/members/${memberId}`);
          if (res.ok) {
            const data = await res.json();
            setFallbackMember(data);
          }
        } catch (error) {
          console.error("Failed to fetch member fallback", error);
        }
      }

      setIsLoading(false);
    };
    loadData();
  }, []);

  const member = useMemo(() =>
    members.find((m) => m.id === memberId) || fallbackMember,
    [members, memberId, fallbackMember]
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

  const activeSub = useMemo(() => {
    // 1. Try to find in the loaded history (for managers/owners)
    const found = memberSubs.find(s => isSubscriptionActive(s.endDate, s.status));
    if (found) return found;

    // 2. Fallback to injected data from API (for trainers who can't see history)
    if ((member as any)?.activeSubscription) {
      return (member as any).activeSubscription;
    }

    return null;
  }, [memberSubs, member]);

  if (!isLoading && !member) {
    return (
      <div className="container max-w-2xl mx-auto">
        <Card className="p-12 text-center rounded-none bg-transparent border-none ">
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
    if (!member) return;
    try {
      await deleteMember(memberId, { permanent: !!member.deletedAt });
      toast.success(member.deletedAt ? "Member record permanently purged" : "Member moved to trash");
      router.push("/members");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleRestore = async () => {
    try {
      await restoreMember(memberId);
      toast.success("Member successfully restored");
      // Reload member data to update UI
      loadMembers();
    } catch (error) {
      toast.error("Failed to restore member");
    }
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
      setIsRenewing(true);
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
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Button variant="ghost" asChild className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-foreground hover:bg-white/5 h-10 px-4 rounded-xl transition-all">
          <Link href="/members">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Back to Roster
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {((session?.user as any)?.role !== 'trainer') && (
            <Button variant="outline" size="sm" asChild className="h-10 px-5 rounded-xl border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary/50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.0)] hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <Link href={`/members/${memberId}/edit`}>
                <Edit className="w-3.5 h-3.5 mr-2" />
                Edit Profile
              </Link>
            </Button>
          )}

          {member?.deletedAt && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestore}
              className="h-10 px-5 rounded-xl border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Restore Member
            </Button>
          )}

          {['owner', 'gym_owner', 'super_admin', 'manager'].includes((session?.user as any)?.role) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeletingMember(true)}
              className="h-10 px-5 rounded-xl border border-red-500/20 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              {isLoading ? <Skeleton className="w-16 h-3 bg-white/20" /> : (member?.deletedAt ? "Purge Data" : "Delete Member")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="glass-premium overflow-hidden border-border dark:bg-slate-950/40">
            <div className="relative h-32 bg-gradient-to-br from-primary/80 to-primary">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            </div>
            <div className="px-6 pb-8">
              <div className="relative flex justify-center -mt-16 mb-4">
                {isLoading ? (
                  <Skeleton className="w-32 h-32 rounded-2xl mx-auto border-4 border-background shadow-2xl" />
                ) : member?.photoBase64 ? (
                  <img
                    src={member.photoBase64}
                    alt="Profile"
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-background shadow-2xl shadow-foreground/20 bg-muted"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-secondary border-4 border-background shadow-2xl flex items-center justify-center text-muted-foreground font-bold text-3xl">
                    {member?.firstName?.[0]}{member?.lastName?.[0]}
                  </div>
                )}
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center shadow-lg transform translate-x-1/4",
                  (isLoading || activeSub) ? "bg-emerald-500" : "bg-destructive"
                )}>
                  {isLoading ? <Skeleton className="w-4 h-4 rounded-full bg-white/20" /> : <ShieldCheck className="w-4 h-4 text-white" />}
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="text-2xl font-bold tracking-tight">{isLoading ? <Skeleton className="w-48 h-8 mx-auto" /> : `${member?.firstName} ${member?.lastName}`}</div>
                <div className="text-sm text-muted-foreground font-medium uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted/50 inline-block">
                  {isLoading ? <Skeleton className="w-20 h-4" /> : (member?.planId || "No Plan").replace("plan_", "").toUpperCase()}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-black/20 dark:bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-black/20 dark:bg-slate-900 border border-white/5 flex items-center justify-center shadow-sm">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest italic leading-none mb-1">Email</p>
                    <div className="font-medium truncate font-mono text-[11px] font-bold">{isLoading ? <Skeleton className="w-32 h-3" /> : member?.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-black/20 dark:bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-black/20 dark:bg-slate-900 border border-white/5 flex items-center justify-center shadow-sm">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest italic leading-none mb-1">Phone</p>
                    <div className="font-medium font-mono text-[11px] font-bold">{isLoading ? <Skeleton className="w-24 h-3" /> : member?.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-black/20 dark:bg-white/5 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-black/20 dark:bg-slate-900 border border-white/5 flex items-center justify-center shadow-sm">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest italic leading-none mb-1">Joined</p>
                    <div className="font-medium font-mono text-[11px] font-bold">{isLoading ? <Skeleton className="w-24 h-3" /> : (member?.joinDate ? formatDate(member.joinDate) : "N/A")}</div>
                  </div>
                </div>
              </div>

              {/* Assigned Coach Section */}
              {(isLoading || (member as any)?.trainerId) && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    ASSIGNED COACH
                  </h3>
                  <Link href={`/trainers/${(member as any)?.trainerId?._id || (member as any)?.trainerId?.id || ''}`} className={cn("flex items-center gap-3 p-3 rounded-xl bg-black/20 dark:bg-white/5 border border-white/5 transition-all group", !isLoading && "hover:border-primary/30")}>
                    {isLoading ? (
                      <Skeleton className="w-10 h-10 rounded-full" />
                    ) : (member as any)?.trainerId?.photo ? (
                      <img src={(member as any).trainerId.photo} className="w-10 h-10 rounded-full object-cover" alt="Trainer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                        {((member as any)?.trainerId?.fullName?.[0]) || ((member as any)?.trainerId?.firstName?.[0]) || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {isLoading ? <Skeleton className="w-24 h-4" /> : ((member as any)?.trainerId?.fullName || `${(member as any)?.trainerId?.firstName || ""} ${(member as any)?.trainerId?.lastName || ""}`.trim() || "Unknown Coach")}
                      </div>
                      <div className="text-xs text-muted-foreground">{isLoading ? <Skeleton className="w-16 h-3 mt-1" /> : "Personal Trainer"}</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </Card>


        </div>

        {/* Right Column: Detailed History */}
        <div className="lg:col-span-8 space-y-8">
          {/* Quick Stats / Action Card - Moved to Right Column */}
          {((session?.user as any)?.role !== 'trainer') && (
            <Card className="glass-premium p-6 border-border dark:bg-slate-950/40 space-y-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  MANAGE SUBSCRIPTION
                </h3>
                <div className="h-px w-full bg-white/5 mt-2"></div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1 ml-2 italic">Target Plan</label>
                    <Select
                      value={selectedPlan}
                      onValueChange={(val) => setSelectedPlan(val)}
                    >
                      <SelectTrigger className="w-full !h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                        {selectedPlan ? (
                          <div className="flex justify-between items-center w-full gap-4">
                            <SelectValue />
                          </div>
                        ) : (
                          <SelectValue placeholder="Choose a plan..." />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        {plans.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">
                            <div className="flex justify-between items-center w-full gap-8">
                              <span>{p.name}</span>
                              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-black tracking-tighter group-focus:bg-black/20">
                                {p.duration} Days
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase pl-1 ml-2 italic">Payment Method</label>
                    <Select
                      value={renewMethod}
                      onValueChange={(val) => setRenewMethod(val as any)}
                    >
                      <SelectTrigger className="w-full !h-12 px-6 rounded-xl border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="cash" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">CASH</SelectItem>
                        <SelectItem value="online" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">ONLINE</SelectItem>
                        <SelectItem value="bank_transfer" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">BANK TRANSFER</SelectItem>
                        <SelectItem value="card" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">CARD</SelectItem>
                        <SelectItem value="other" className="text-[10px] font-bold uppercase tracking-widest focus:bg-primary focus:text-black">OTHER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full h-12 shadow-lg shadow-primary/20"
                    onClick={handleRenew}
                    disabled={isRenewing}
                  >
                    {isRenewing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Extend Membership
                      </>
                    )}
                  </Button>
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

                {activeSub && (
                  <p className="text-[11px] text-center text-muted-foreground italic">
                    New sub will start on {formatDate(activeSub.endDate)}
                  </p>
                )}

                {/* Price Breakdown */}
                {selectedPlan && (
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Renewal Period</span>
                      <span className="font-bold text-primary italic uppercase tracking-tighter">{plans.find(p => p.id === selectedPlan)?.duration} Days</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base Price</span>
                      <span className="font-medium">{formatCurrency(plans.find(p => p.id === selectedPlan)?.price || 0)}</span>
                    </div>
                    {businessSettings.taxPercentage > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Tax ({businessSettings.taxPercentage}%)</span>
                        <span className="font-medium text-amber-600">+{formatCurrency((plans.find(p => p.id === selectedPlan)?.price || 0) * (businessSettings.taxPercentage / 100))}</span>
                      </div>
                    )}
                    {memberSubs.length === 0 && businessSettings.joiningFee > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Joining Fee</span>
                        <span className="font-medium text-amber-600">+{formatCurrency(businessSettings.joiningFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-dashed">
                      <span>Total Amount</span>
                      <span className="text-primary">
                        {formatCurrency(
                          ((plans.find(p => p.id === selectedPlan)?.price || 0) * (1 + (businessSettings.taxPercentage / 100))) +
                          (memberSubs.length === 0 ? businessSettings.joiningFee : 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {member?.deletedAt && (
            <Card className="glass-premium p-6 border-border border-l-4 border-l-destructive bg-destructive/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-destructive">Member in Trash</h4>
                  <p className="text-sm text-muted-foreground leading-none mt-1">
                    This account was deleted on {formatDate(member.deletedAt)}. Actions are restricted.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="opacity-80 hover:opacity-100" onClick={handleRestore}>Restore Now</Button>
            </Card>
          )}
          {/* Active Status Banner - Visible to all roles */}
          <Card className={cn(
            "glass-premium gap-1 p-6 border-y-border border-r-border border-l-4 flex items-center justify-between shadow-2xl transition-all",
            isLoading ? "border-l-border" : (activeSub ? "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/5" : "border-l-destructive bg-destructive/5")
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                isLoading ? "bg-muted text-muted-foreground" : (activeSub ? "bg-emerald-100 text-emerald-600" : "bg-destructive/10 text-destructive")
              )}>
                {isLoading ? <Skeleton className="w-6 h-6 rounded-full" /> : (activeSub ? <CreditCard className="w-6 h-6" /> : <Clock className="w-6 h-6" />)}
              </div>
              <div>
                <div className="font-bold text-foreground">
                  {isLoading ? <Skeleton className="w-32 h-5" /> : (activeSub ? "Membership Active" : "Membership Expired")}
                </div>
                <div className="text-sm text-muted-foreground leading-none mt-1 text-emerald-500">
                  {isLoading ? <Skeleton className="w-48 h-4 mt-1" /> : (activeSub
                    ? `Expiring on ${formatDate(activeSub.endDate)}`
                    : `Last active on ${memberSubs[0] ? formatDate(memberSubs[0].endDate) : 'never'}`)}
                </div>
              </div>
            </div>
            {!isLoading && !activeSub && (
              <span className="animate-pulse flex items-center gap-1 text-xs font-bold text-destructive uppercase tracking-widest bg-destructive/10 px-3 py-1 rounded-full">
                Renewal Needed
              </span>
            )}
          </Card>

          {((session?.user as any)?.role !== 'trainer') && (
            <>
              {/* Subscriptions History */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    MEMBERSHIP HISTORY
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="space-y-3">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="w-full h-24 rounded-2xl" />
                      <Skeleton className="w-full h-24 rounded-2xl" />
                    </div>
                  ) : memberSubs.length > 0 ? (
                    memberSubs.map((sub, idx) => {
                      const isActive = isSubscriptionActive(sub.endDate, sub.status);
                      const planName = plans.find(p => p.id === sub.planId)?.name || sub.planId;
                      return (
                        <div key={sub.id} className="glass-premium group relative flex items-start gap-6 p-6 border-border dark:bg-slate-950/40">
                          <div className={cn(
                            "mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors",
                            isActive && sub.status !== "paused" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border/20",
                            sub.status === "paused" && "bg-amber-500/10 text-amber-500 border-amber-500/20"
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
                                {((session?.user as any)?.role !== 'trainer') && (
                                  <div className="flex items-center gap-1 opacity-100 ml-2">
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
                                )}
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
              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    PAYMENT RECORDS
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-6 py-6 font-black text-slate-500 italic text-left">Transaction ID</th>
                          <th className="px-6 py-6 font-black text-slate-500 italic text-left">Date</th>
                          <th className="px-6 py-6 font-black text-slate-500 italic text-left">Method</th>
                          <th className="px-6 py-6 font-black text-slate-500 italic text-right relative min-w-[100px]">Amount</th>
                          {((session?.user as any)?.role !== 'trainer') && (
                            <th className="px-6 py-6 font-black text-slate-500 italic text-right text-slate-500 uppercase tracking-widest">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="py-6 px-6"><Skeleton className="w-full h-8" /></td>
                          </tr>
                        ) : memberPayments.length > 0 ? (
                          memberPayments.map((pay) => (
                            <tr key={pay.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                              <td className="px-6 py-6 font-mono text-[10px] text-slate-500 flex items-center gap-2">
                                {pay.id.slice(-8).toUpperCase()}
                                {pay.receiptUrl && (
                                  <button
                                    onClick={() => setPreviewReceiptUrl(pay.receiptUrl || null)}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors cursor-pointer border border-emerald-500/20"
                                    title="View Receipt"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-6 font-mono text-slate-400 text-[11px]">{formatDate(pay.date)}</td>
                              <td className="px-6 py-6">
                                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest uppercase">
                                  {pay.method || "Cash"}
                                </span>
                              </td>
                              <td className="px-6 py-6 text-right font-black tracking-tighter text-base text-foreground font-mono">
                                {formatCurrency(pay.amount)}
                              </td>
                              {((session?.user as any)?.role !== 'trainer') && (
                                <td className="px-6 py-6 text-right">
                                  <div className="flex justify-end gap-1 opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-primary hover:border-primary/50 transition-all"
                                      onClick={() => handleOpenEditPayment(pay)}
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                      onClick={() => setDeletePaymentId(pay.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                              No payment history recorded for this member.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Workout Assignment - Only for Assigned Trainer */}
          {((session?.user as any)?.role === 'trainer' &&
            ((member as any).trainerId?._id === (session?.user as any)?.id || (member as any).trainerId === (session?.user as any)?.id)) && (
              <div className="space-y-6 mt-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    WORKOUT PLAN
                  </h3>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <Card className="glass-premium p-6 border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Dumbbell className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">
                        {isLoading ? <Skeleton className="w-48 h-5" /> : (workoutPlans.find(wp => wp._id === member?.workoutPlanId || wp.id === member?.workoutPlanId)?.name || "No Plan Assigned")}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-none mt-1">
                        {isLoading ? <Skeleton className="w-32 h-4 mt-1" /> : (member?.workoutPlanId ? "Active Workout Plan" : "No plan assigned")}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={member?.workoutPlanId || ""}
                      onValueChange={(planId) => {
                        if (planId) {
                          toast.promise(assignWorkoutToMember(memberId, planId), {
                            loading: "Assigning plan...",
                            success: "Plan assigned successfully",
                            error: (err) => err.message || "Assignment failure"
                          });
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10 px-3 py-2 rounded-md border border-input bg-background/50 text-sm focus:ring-2 focus:ring-primary transition-all min-w-[150px]">
                        <SelectValue placeholder="Select Plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {workoutPlans.map((wp) => (
                          <SelectItem key={wp._id || wp.id} value={wp._id || wp.id}>
                            {wp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              </div>
            )}
        </div>
      </div>

      {/* Delete Member Confirmation */}
      <ConfirmModal
        open={isDeletingMember}
        onOpenChange={setIsDeletingMember}
        title={member?.deletedAt ? "Permanently Purge" : "Delete"}
        highlight="Member Profile?"
        description={member?.deletedAt
            ? "This is a final action. This member's entire history, billing, and attendance will be purged from the system forever."
            : "The member will be moved to the trash and hidden from active lists."
        }
        onConfirm={handleDelete}
        confirmText={member?.deletedAt ? "Permanently Purge" : "Move to Trash"}
        variant="destructive"
      />

      {/* Delete Subscription Confirmation */}
      <ConfirmModal
        open={deleteSubId !== null}
        onOpenChange={(open) => !open && setDeleteSubId(null)}
        title="Delete"
        highlight="Subscription Record?"
        description={
            <>This will remove this specific membership period and its <strong>associated payment record</strong>. This may affect the member's current status.</>
        }
        onConfirm={handleDeleteSubscription}
        confirmText="Delete Record"
        variant="destructive"
      />

      {/* Delete Payment Confirmation */}
      <ConfirmModal
        open={deletePaymentId !== null}
        onOpenChange={(open) => !open && setDeletePaymentId(null)}
        title="Delete"
        highlight="Payment Record?"
        description={
            <>Are you sure you want to delete this payment record? This will <strong>NOT</strong> affect the member's subscription status, but it will be removed from all financial totals.</>
        }
        onConfirm={handleDeletePayment}
        confirmText="Delete Record"
        variant="destructive"
      />

      {/* Edit Payment Modal */}
      <Dialog open={isEditPaymentModalOpen} onOpenChange={setIsEditPaymentModalOpen}>
        <DialogContent className="max-w-md glass-premium  border-border">
          <DialogHeader>
            <DialogTitle>Edit Payment Record</DialogTitle>
            <DialogDescription>
              Correct transaction details for this record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label={`Amount (${gymProfile.name})`}
                type="number"
                validateType="number"
                value={String(paymentEditData.amount)}
                onChange={(val) => setPaymentEditData({ ...paymentEditData, amount: Number(val) })}
                leadingIcon={<CreditCard className="w-4 h-4" />}
                className="pl-9"
              />
              <div className="space-y-2">
                <Label htmlFor="edit-method">Method</Label>
                <Select
                  value={paymentEditData.method}
                  onValueChange={(val) => setPaymentEditData({ ...paymentEditData, method: val as any })}
                >
                  <SelectTrigger id="edit-method" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <SelectValue placeholder="Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <InputField
              label="Transaction Date"
              type="date"
              validateType="text"
              value={paymentEditData.date ? new Date(paymentEditData.date).toISOString().split('T')[0] : ""}
              onChange={(val) => setPaymentEditData({ ...paymentEditData, date: new Date(val).toISOString() })}
              leadingIcon={<Calendar className="w-4 h-4" />}
              className="pl-9"
            />

            <InputField
              label="Description"
              validateType="text"
              placeholder="e.g. Monthly Renewal"
              value={paymentEditData.description}
              onChange={(val) => setPaymentEditData({ ...paymentEditData, description: val })}
            />

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
