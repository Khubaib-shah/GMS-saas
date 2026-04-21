"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Edit2, Plus, Trash2, PauseCircle, PlayCircle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  isSubscriptionActive,
  formatDate,
  formatCurrency,
} from "@/lib/utils/file-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { InputField } from "@/components/ui/input-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import Link from "next/link";
import { PlanSkeleton } from "@/components/plan-skeleton";
import { div } from "three/src/nodes/math/OperatorNode.js";

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const queryGymId = searchParams.get("gymId");
  const isAdmin = (session?.user as any)?.role === "super_admin";
  const userRole = (session?.user as any)?.role;
  const canCreatePlans = hasPermission(userRole, PERMISSIONS.PLANS_CREATE);
  const canEditPlans = hasPermission(userRole, PERMISSIONS.PLANS_EDIT);
  const canDeletePlans = hasPermission(userRole, PERMISSIONS.PLANS_DELETE);

  const store = useAppStore();
  const [gyms, setGyms] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Pause/Resume state
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [editFormData, setEditFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        store.loadPlans(),
        store.loadSubscriptions(),
        store.loadMembers()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  const [addFormData, setAddFormData] = useState<{
    id: string;
    name: string;
    price: number | "";
    duration: number | "";
    description: string;
    gymId: string;
  }>({
    id: "",
    name: "",
    price: "",
    duration: 30,
    description: "",
    gymId: "",
  });

  // Fetch gyms for select if admin
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/super-admin/gyms")
        .then((res) => res.json())
        .then((data) => {
          setGyms(data);
          // Pre-fill gymId from query if valid
          if (queryGymId) {
            setAddFormData((prev) => ({ ...prev, gymId: queryGymId }));
          }
        })
        .catch((err) => console.error("Failed to fetch gyms", err));
    }
  }, [isAdmin, queryGymId]);

  const handlePlanAdd = async () => {
    if (!addFormData.id || !addFormData.name) {
      toast.error("ID and Name are required");
      return;
    }
    try {
      setLoading(true);
      await store.addPlan({
        ...addFormData,
        price: Number(addFormData.price),
        duration: Number(addFormData.duration) || 30,
      });
      setShowAddModal(false);
      setAddFormData({
        id: "",
        name: "",
        price: "",
        duration: 30,
        description: "",
        gymId: "",
      });
      toast.success("Plan added successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to add plan");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanUpdate = async () => {
    if (!editFormData || !selectedPlan) return;
    try {
      setLoading(true);
      await store.updatePlan(selectedPlan.id, editFormData);
      setShowEditModal(false);
      toast.success("Plan updated successfully");
    } catch (error) {
      toast.error("Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      setLoading(true);
      await store.deletePlan(planToDelete);
      toast.success("Plan deleted");
    } catch (e) {
      toast.error("Failed to delete plan");
    } finally {
      setLoading(false);
      setPlanToDelete(null);
    }
  };

  const handlePauseSubscription = async () => {
    if (!selectedSubscription) return;
    setIsProcessing(true);
    try {
      await store.pauseSubscription(selectedSubscription.id, pauseReason);
      toast.success("Subscription paused successfully");
      setShowPauseDialog(false);
      setPauseReason("");
      setSelectedSubscription(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to pause subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    if (!selectedSubscription) return;
    setIsProcessing(true);
    try {
      await store.resumeSubscription(selectedSubscription.id);
      toast.success("Subscription resumed successfully");
      setShowResumeDialog(false);
      setSelectedSubscription(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to resume subscription");
    } finally {
      setIsProcessing(false);
    }
  };


  const filteredPlans = store.plans.filter((plan) => {
    if (!store.searchQuery) return true;
    const lower = store.searchQuery.toLowerCase();
    const gym = gyms.find((g) => g._id === plan.gymId);
    return (
      plan.name.toLowerCase().includes(lower) ||
      plan.id.toLowerCase().includes(lower) ||
      (gym?.name || "").toLowerCase().includes(lower)
    );
  });

  const memberSubscriptions = store.subscriptions
    .map((sub) => {
      const member = store.members.find((m) => m.id === sub.memberId);
      const plan = store.plans.find((p) => p.id === sub.planId);
      const gym = gyms.find((g) => g._id === sub.gymId);
      return { ...sub, member, plan, gym };
    })
    .filter((sub) => sub.member) // Filter out orphans (deleted members)
    .filter((sub) => {
      if (!store.searchQuery) return true;
      const lower = store.searchQuery.toLowerCase();
      return (
        `${sub.member?.firstName} ${sub.member?.lastName || ""}`
          .toLowerCase()
          .includes(lower) ||
        (sub.plan?.name || "").toLowerCase().includes(lower) ||
        (sub.gym?.name || "").toLowerCase().includes(lower)
      );
    });

  return (
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="GYM"
        highlight="PLANS"
        subtitle="Manage your gym's membership plans"
        description="Create and update plans for your members"
      >
        {(canCreatePlans || status === "loading") && (
          <Button onClick={() => setShowAddModal(true)} className="h-[38px] px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group gap-2" disabled={status === "loading"}>
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            {status === "loading" ? "Loading..." : "Add Plan"}
          </Button>
        )}
      </DashboardHeader>

      {/* Plans Section */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">AVAILABLE PLANS</h3>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 3 }).map((_, i) => (
          <PlanSkeleton key={i} />
        ))}</div> : isAdmin ? (
          <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">GYM NAME</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">PLAN NAME</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">PRICE</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">DURATION</th>
                    <th className="text-center py-6 px-6 font-black text-slate-500 italic">MEMBERS</th>
                    {(canEditPlans || canDeletePlans) && <th className="text-right py-6 px-6 font-black text-slate-500 italic">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((plan) => {
                      const gym = gyms.find(g => g._id === plan.gymId);
                      const memberCount = store.subscriptions.filter(
                        (s) => s.planId === plan.id
                      ).length;

                      return (
                        <tr key={plan.mongoId || `${plan.gymId}-${plan.id}`} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                          <td className="py-6 px-6 font-black italic text-foreground tracking-tighter">
                            {gym?.name || "Unknown Gym"}
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex flex-col">
                              <span className="font-black text-foreground">{plan.name}</span>
                              <span className="text-[9px] font-mono text-slate-500">ID: {plan.id.slice(-8)}</span>
                            </div>
                          </td>
                          <td className="py-6 px-6 font-mono text-primary">{formatCurrency(plan.price)}</td>
                          <td className="py-6 px-6 font-mono text-slate-500">{plan.duration} DAYS</td>
                          <td className="py-6 px-6 text-center">
                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest border border-primary/20">
                              {memberCount} ACTIVE
                            </span>
                          </td>
                          {(canEditPlans || canDeletePlans) && (
                            <td className="py-6 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                {canEditPlans && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPlan(plan);
                                      setEditFormData({
                                        ...plan,
                                        price: plan.price,
                                      });
                                      setShowEditModal(true);
                                    }}
                                    className="h-8 w-8 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-primary hover:border-primary/50 transition-all opacity-0 group-hover/row:opacity-100"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {canDeletePlans && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/row:opacity-100"
                                    onClick={() => setPlanToDelete(plan.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={(canEditPlans || canDeletePlans) ? 6 : 5} className="py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                        No plans created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const memberCount = store.subscriptions.filter(
                (s) => s.planId === plan.id
              ).length;
              return (
                <div
                  key={plan.mongoId || `${plan.gymId}-${plan.id}`}
                  className="glass-premium p-8 border-border flex flex-col justify-between"
                >
                  <div>
                    {/* Title + Duration */}
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                      <h3 className="text-lg font-black italic tracking-tighter uppercase">{plan.name}</h3>
                      <span className="text-[9px] bg-primary/10 text-primary px-2 py-1 rounded-md font-black tracking-widest uppercase border border-primary/20">
                        {plan.duration} days
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-2 flex items-end gap-1">
                      <span className="text-4xl font-black text-primary font-mono tracking-tighter">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest pb-1.5">
                        /mo
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-400 mb-2 font-medium leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>

                    {/* Members */}
                    <div className="p-4 mb-2 text-center flex gap-4 items-center justify-center border-t border-white/5">
                      <p className="text-3xl font-black italic tracking-tighter text-foreground">{memberCount}</p>
                      <div className="text-left">
                        <p className="text-[9px] font-black tracking-widest uppercase text-slate-500">Active</p>
                        <p className="text-[10px] font-black tracking-widest uppercase text-slate-400">Members</p>
                      </div>
                    </div>
                  </div>

                  {(canEditPlans || canDeletePlans) && (
                    <div className="flex gap-2 items-center justify-center mt-auto">
                      {canEditPlans && (
                        <Button
                          variant="outline"
                          className="flex-1 rounded-xl font-black italic tracking-tighter !h-[38px] border-white/10 bg-white/5 text-slate-400 hover:text-white transition-all text-xs uppercase"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setEditFormData({
                              ...plan,
                              price: plan.price,
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}

                      {canDeletePlans && (
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-xl font-black italic tracking-tighter !h-[38px] border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-400 hover:text-white transition-all text-xs"
                          onClick={() => setPlanToDelete(plan.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">MEMBER SUBSCRIPTIONS ({memberSubscriptions.length})</h3>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-bold tracking-widest uppercase">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="text-left py-6 px-6 font-black text-slate-500 italic">MEMBER</th>
                  <th className="text-left py-6 px-6 font-black text-slate-500 italic">PLAN</th>
                  <th className="text-left py-6 px-6 font-black text-slate-500 italic">START DATE</th>
                  <th className="text-left py-6 px-6 font-black text-slate-500 italic">EXPIRY DATE</th>
                  <th className="text-left py-6 px-6 font-black text-slate-500 italic">STATUS</th>
                  <th className="text-right py-6 px-6 font-black text-slate-500 italic">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5 animate-pulse">
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/5" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-white/5 rounded" />
                            <div className="h-3 w-20 bg-white/5 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                      </td>
                      <td className="py-6 px-6">
                        <div className="h-4 w-20 bg-white/5 rounded" />
                      </td>
                      <td className="py-6 px-6">
                        <div className="h-4 w-20 bg-white/5 rounded" />
                      </td>
                      <td className="py-6 px-6">
                        <div className="h-6 w-20 bg-white/5 rounded-lg" />
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-white/5 rounded-xl" />
                          <div className="h-8 w-8 bg-white/5 rounded-xl" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : memberSubscriptions.length > 0 ? (
                  memberSubscriptions.map((sub) => {
                    const isActive = isSubscriptionActive(sub.endDate, sub.status);
                    const isPaused = sub.status === "paused";

                    return (
                      <tr key={sub.id || sub.mongoId} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="flex justify-center items-center w-8 h-8 rounded-xl border border-white/5 grayscale group-hover/row:grayscale-0 transition-all">
                              <AvatarFallback className="bg-primary/10 text-primary font-black italic text-[10px]">
                                {sub.member?.firstName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-black italic text-foreground tracking-tighter block group-hover/row:text-primary transition-colors">
                                {sub.member?.firstName} {sub.member?.lastName || ""}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">ID: {sub.memberId?.slice(-8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6 font-black uppercase text-slate-300">{sub.plan?.name}</td>
                        <td className="py-6 px-6 font-mono text-slate-500">{formatDate(sub.startDate)}</td>
                        <td className="py-6 px-6 font-mono">
                          {isPaused ? (
                            <div>
                              <span className="line-through text-muted-foreground text-xs block">{formatDate(sub.originalEndDate || sub.endDate)}</span>
                              <span className="text-amber-500">{formatDate(sub.endDate)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-500">{formatDate(sub.endDate)}</span>
                          )}
                        </td>
                        <td className="py-6 px-6">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black italic tracking-widest",
                            isPaused
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                              : isActive
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-red-500/10 border-red-500/20 text-red-500"
                          )}>
                            <div className={cn("w-1 h-1 rounded-full", isPaused ? "bg-amber-500" : isActive ? "bg-primary" : "bg-red-500")} />
                            {isPaused ? "PAUSED" : isActive ? "ACTIVE" : "EXPIRED"}
                          </div>
                          {sub.totalPausedDays ? (
                            <div className="text-[9px] font-mono font-black text-muted-foreground mt-2 uppercase">
                              Paused: {sub.totalPausedDays}d
                            </div>
                          ) : null}
                        </td>
                        <td className="py-6 px-6 text-right space-x-2">
                          {isPaused ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-emerald-500/10 bg-emerald-500/5 transition-all text-emerald-500 hover:text-white hover:bg-emerald-500 opacity-0 group-hover/row:opacity-100"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowResumeDialog(true);
                              }}
                              title="Resume Subscription"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          ) : isActive ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-amber-500/10 bg-amber-500/5 transition-all text-amber-500 hover:text-white hover:bg-amber-500 row:opacity-100"
                              onClick={() => {
                                setSelectedSubscription(sub);
                                setShowPauseDialog(true);
                              }}
                              title="Pause Subscription"
                            >
                              <PauseCircle className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Link href={`/members/${sub.member?.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-xl border border-emerald-500/10 bg-emerald-500/5 transition-all text-emerald-500 hover:text-white hover:bg-emerald-500 row:opacity-100"
                              title="View Member"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                      No subscriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update the details of the {selectedPlan?.name} plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <InputField
              label="Plan Name"
              validateType="text"
              value={editFormData?.name || ""}
              onChange={(val) =>
                setEditFormData({ ...editFormData, name: val })
              }
              required
            />
            <InputField
              label="Price"
              validateType="number"
              value={editFormData?.price?.toString() ?? ""}
              onChange={(val) =>
                setEditFormData({
                  ...editFormData,
                  price: val === "" ? "" : Number(val),
                })
              }
              required
            />
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData?.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlanUpdate} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Plan Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Plan</DialogTitle>
            <DialogDescription>
              Create a new subscription plan for your gym members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="gym-select">Assign to Gym</Label>
                <Select
                  value={addFormData.gymId}
                  onValueChange={(val) => setAddFormData({ ...addFormData, gymId: val })}
                >
                  <SelectTrigger className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <SelectValue placeholder="Select a Gym" />
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map((gym) => (
                      <SelectItem key={gym._id} value={gym._id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <InputField
              label="Plan ID (Unique)"
              validateType="text"
              placeholder="e.g. plan_gold"
              value={addFormData.id}
              onChange={(val) =>
                setAddFormData({ ...addFormData, id: val })
              }
              required
            />
            <InputField
              label="Plan Name"
              validateType="text"
              placeholder="Gold Plan"
              value={addFormData.name}
              onChange={(val) =>
                setAddFormData({ ...addFormData, name: val })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Price"
                validateType="number"
                value={addFormData.price.toString()}
                onChange={(val) =>
                  setAddFormData({
                    ...addFormData,
                    price: val === "" ? "" : Number(val),
                  })
                }
                required
              />
              <InputField
                label="Duration (Days)"
                validateType="number"
                value={addFormData.duration.toString()}
                onChange={(val) =>
                  setAddFormData({
                    ...addFormData,
                    duration: val === "" ? "" : Number(val),
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={addFormData.description}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePlanAdd} disabled={loading}>
              {loading ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
        title="Delete"
        highlight="Plan?"
        description="This action cannot be undone. This will permanently delete the subscription plan."
        onConfirm={handleDeletePlan}
        confirmText="Delete"
        variant="destructive"
      />

      {/* Pause Subscription Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Subscription</DialogTitle>
            <DialogDescription>
              Pausing will stop the subscription timer. The end date will be extended by the number of days paused when resumed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pause-reason">Reason (Optional)</Label>
              <Textarea
                id="pause-reason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Member requested freeze for vacation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePauseSubscription} disabled={isProcessing}>
              {isProcessing ? "Pausing..." : "Pause Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Subscription Dialog */}
      <ConfirmModal
        open={showResumeDialog}
        onOpenChange={setShowResumeDialog}
        title="Resume"
        highlight="Subscription"
        description="Are you sure you want to resume this subscription? The end date will be extended based on how long it was paused."
        onConfirm={handleResumeSubscription}
        loading={isProcessing}
        confirmText="Resume Subscription"
        variant="primary"
      />
    </div>
  );
}
