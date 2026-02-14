"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Card } from "@/components/ui/card";
import { Edit2, Plus, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
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
import { Input } from "@/components/ui/input";
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
      fetch("/api/admin/gyms")
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
    }
  };

  const handlePlanUpdate = async () => {
    if (!editFormData || !selectedPlan) return;
    try {
      await store.updatePlan(selectedPlan.id, editFormData);
      setShowEditModal(false);
      toast.success("Plan updated successfully");
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await store.deletePlan(planToDelete);
      toast.success("Plan deleted");
    } catch (e) {
      toast.error("Failed to delete plan");
    } finally {
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
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Subscriptions
          </h1>
          <p className="text-muted-foreground">
            Manage subscription plans and member subscriptions
          </p>
        </div>
        {(canCreatePlans || status === "loading") && (
          <Button onClick={() => setShowAddModal(true)} className="gap-2" disabled={status === "loading"}>
            <Plus className="w-4 h-4" />
            {status === "loading" ? "Loading..." : "Add Plan"}
          </Button>
        )}
      </div>

      {/* Plans Section */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Available Plans
        </h2>
        
        {isAdmin ? (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gym Name</TableHead>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-center">Active Members</TableHead>
                  {(canEditPlans || canDeletePlans) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => {
                    const gym = gyms.find(g => g._id === plan.gymId);
                    const memberCount = store.subscriptions.filter(
                      (s) => s.planId === plan.id
                    ).length;
                    
                    return (
                      <TableRow key={plan.mongoId || `${plan.gymId}-${plan.id}`}>
                        <TableCell className="font-medium">
                          {gym?.name || "Unknown Gym"}
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                             <span className="font-semibold">{plan.name}</span>
                             <span className="text-xs text-muted-foreground">{plan.id}</span>
                           </div>
                        </TableCell>
                        <TableCell>{formatCurrency(plan.price)}</TableCell>
                        <TableCell>{plan.duration} days</TableCell>
                        <TableCell className="text-center">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                            {memberCount}
                          </span>
                        </TableCell>
                        {(canEditPlans || canDeletePlans) && (
                        <TableCell className="text-right">
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
                             >
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             )}
                             {canDeletePlans && (
                             <Button
                               variant="ghost"
                               size="sm"
                               className="text-destructive hover:text-destructive hover:bg-destructive/10"
                               onClick={() => setPlanToDelete(plan.id)}
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                             )}
                          </div>
                        </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={(canEditPlans || canDeletePlans) ? 6 : 5} className="h-24 text-center text-muted-foreground">
                      No plans created yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlans.map((plan) => {
              const memberCount = store.subscriptions.filter(
                (s) => s.planId === plan.id
              ).length;
              return (
                <Card
                  key={plan.mongoId || `${plan.gymId}-${plan.id}`}
                  className="p-5 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    {/* Title + Duration */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md">
                        {plan.duration} days
                      </span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-3xl font-bold">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        /month
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                      {plan.description}
                    </p>

                    {/* Members */}
                    <div className="bg-muted/50 rounded-xl p-3 mb-5 text-center">
                      <p className="text-xl font-bold">{memberCount}</p>
                      <p className="text-xs text-muted-foreground">
                        Active Members
                      </p>
                    </div>
                  </div>

                  {(canEditPlans || canDeletePlans) && (
                    <div className="flex gap-2 items-center justify-center mt-auto">
                      {canEditPlans && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
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
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPlanToDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscriptions Table */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6">
          Member Subscriptions ({memberSubscriptions.length})
        </h2>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberSubscriptions.length > 0 ? (
                memberSubscriptions.map((sub) => (
                  <TableRow key={sub.id || sub.mongoId}>
                    <TableCell className="font-medium">
                      {sub.member?.firstName} {sub.member?.lastName || ""}
                    </TableCell>
                    <TableCell>{sub.plan?.name}</TableCell>
                    <TableCell>{formatDate(sub.startDate)}</TableCell>
                    <TableCell>{
                      sub.status === "paused"
                       ? <div>
                           <span className="line-through text-muted-foreground text-xs block">{formatDate(sub.originalEndDate || sub.endDate)}</span>
                           <span>{formatDate(sub.endDate)}</span>
                         </div>
                       : formatDate(sub.endDate)
                    }</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-xs font-medium",
                          sub.status === "paused"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : isSubscriptionActive(sub.endDate, sub.status)
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        {sub.status === "paused"
                          ? "Paused"
                          : isSubscriptionActive(sub.endDate, sub.status)
                          ? "Active"
                          : "Expired"}
                      </span>
                      {sub.totalPausedDays ? (
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Paused: {sub.totalPausedDays}d
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      {sub.status === "paused" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setShowResumeDialog(true);
                          }}
                          title="Resume Subscription"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                      ) : isSubscriptionActive(sub.endDate, sub.status) ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
                          onClick={() => {
                            setSelectedSubscription(sub);
                            setShowPauseDialog(true);
                          }}
                          title="Pause Subscription"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No subscriptions yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
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
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={editFormData?.name || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                value={editFormData?.price ?? ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    price: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </div>
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
            <Button onClick={handlePlanUpdate}>Save Changes</Button>
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
                <select
                  id="gym-select"
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={addFormData.gymId}
                  onChange={(e) => setAddFormData({ ...addFormData, gymId: e.target.value })}
                  required
                >
                  <option value="">Select a Gym</option>
                  {gyms.map((gym) => (
                    <option key={gym._id} value={gym._id}>
                      {gym.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="id">Plan ID (Unique)</Label>
              <Input
                id="id"
                value={addFormData.id}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, id: e.target.value })
                }
                placeholder="e.g. plan_gold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={addFormData.name}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, name: e.target.value })
                }
                placeholder="Gold Plan"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={addFormData.price}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      price:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (Days)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={addFormData.duration}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      duration:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                />
              </div>
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
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlanAdd}>Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!planToDelete}
        onOpenChange={(open) => !open && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subscription plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-[#fcfcfc] hover:bg-destructive/90"
              onClick={handleDeletePlan}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resume this subscription? The end date will be extended based on how long it was paused.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResumeSubscription} disabled={isProcessing}>
              {isProcessing ? "Resuming..." : "Resume Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
