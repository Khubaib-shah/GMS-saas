"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Plus, Trash2, QrCode, Sparkles, Users, Filter, Eye, AlertTriangle, CircleCheckBigIcon, AlertCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { MemberQrDialog } from "@/components/member-qr-dialog";
import { Button } from "@/components/ui/button";
import { PaginationHUD } from "@/components/ui/pagination-hud";
import { InputField } from "@/components/ui/input-field";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, formatDate } from "@/lib/utils/file-utils";
import { toast } from "sonner";

export default function MembersPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium;
  const store = useAppStore();
  const canScan = store.gymProfile?.enabledFeatures?.includes("qrAttendance") || store.gymProfile?.enabledFeatures?.includes("attendance") || isPremium;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrMember, setQrMember] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        store.loadMembers({ showDeleted: showTrash }),
        store.loadSubscriptions(),
        store.loadGymProfile(),
        store.loadBusinessSettings()
      ]);
      setLoading(false);
    };
    loadData();
  }, [showTrash]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, store.searchQuery]);

  const filtered = useMemo(() => {
    let result = store.members;
    const currentSearch = store.searchQuery || searchTerm;
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    // Trainer Filter
    if (userRole === 'trainer' && userId) {
      result = result.filter(m => (m as any).trainerId === userId || (m as any).trainerId?._id === userId);
    }

    if (currentSearch) {
      const lower = currentSearch.toLowerCase();
      result = result.filter(
        (m) =>
          `${m.firstName} ${m.lastName || ""}`.toLowerCase().includes(lower) ||
          (m.phone || "").includes(currentSearch) ||
          (m.email || "").toLowerCase().includes(lower)
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((m) => {
        const graceDays = store.businessSettings.gracePeriodDays || 0;
        // 1. Check local subscriptions first
        const subs = store.subscriptions.filter((s) => s.memberId === m.id);
        let isActive = subs.some((s) => isSubscriptionActive(s.endDate, s.status, graceDays));

        // 2. Fallback to injected status
        if (!isActive && (m as any).activeSubscription) {
          isActive = isSubscriptionActive((m as any).activeSubscription.endDate, (m as any).activeSubscription.status, graceDays);
        }

        return filterStatus === "active" ? isActive : !isActive;
      });
    }

    return result;
  }, [store.members, store.subscriptions, store.searchQuery, searchTerm, filterStatus, session]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleDelete = async (id: string) => {
    try {
      await store.deleteMember(id, { permanent: showTrash });
      setDeleteId(null);
      toast.success(showTrash ? "Member permanently deleted" : "Member moved to trash");
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await store.restoreMember(id);
      toast.success("Member successfully restored");
    } catch (error) {
      toast.error("Failed to restore member");
    }
  };

  return (
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="Member"
        highlight="List"
        subtitle="View and manage your members"
        description="See all your gym members in one place."
      >
        <div className="flex items-center gap-2">
          <Button
            variant={showTrash ? "destructive" : "outline"}
            size="sm"
            onClick={() => setShowTrash(!showTrash)}
            className={cn(
              "!h-[38px] px-8 rounded-xl font-black italic tracking-tighter transition-all",
              showTrash
                ? "bg-destructive text-white shadow-lg shadow-destructive/20"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
            )}
          >
            <Trash2 className="w-5 h-5 mr-2" />
            {showTrash ? "Exit Trash" : "View Trash"}
          </Button>

          {((session?.user as any)?.role !== 'trainer') && !showTrash && (
            <Link href="/members/add">
              <Button className="!h-[38px] px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Add Member
              </Button>
            </Link>
          )}
        </div>
      </DashboardHeader>

      {/* Search & Filter HUD */}
      <div className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-8 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
          <Filter className="w-3.5 h-3.5 text-primary/50" />
          <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
            Filter
          </span>
        </div>

        <div className="flex-1 w-full flex flex-col md:flex-row gap-2">
          <InputField
            hideLabel
            validateType="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm || store.searchQuery}
            onChange={(val) => {
              setSearchTerm(val);
              store.setSearchQuery(val);
            }}
            leadingIcon={<Search className="w-4 h-4" />}
            className="h-10 bg-transparent border-none hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase italic tracking-wider transition-all focus:border-none focus:ring-0"
            containerClassName="flex-1"
          />

          <div className="h-6 w-px bg-white/5 hidden md:block self-center" />

          <Select
            value={filterStatus}
            onValueChange={(value) =>
              setFilterStatus(value as "all" | "active" | "expired")
            }
          >
            <SelectTrigger className="!h-[41px] w-full md:w-56 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
              <span className="text-slate-500 mr-2">Status:</span>
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
              <SelectItem value="all" className="text-[10px] font-bold italic uppercase focus:bg-primary focus:text-black">All Members</SelectItem>
              <SelectItem value="active" className="text-[10px] font-bold italic uppercase focus:bg-primary focus:text-black">Active Members</SelectItem>
              <SelectItem value="expired" className="text-[10px] font-bold italic uppercase focus:bg-primary focus:text-black">Expired Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-bold tracking-widest uppercase">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-center md:text-left py-3 px-2 md:py-6 md:px-6 font-black text-slate-500 italic">
                  Name
                </th>
                <th className="text-left py-3 px-2 md:py-6 md:px-6 font-black text-slate-500 italic text-nowrap">
                  Contact Info
                </th>
                <th className="text-center py-3 px-2 md:py-6 md:px-6 font-black text-slate-500 italic">
                  Subscription
                </th>
                <th className="text-left py-3 px-2 md:py-6 md:px-6 font-black text-slate-500 italic text-nowrap hidden md:table-cell">
                  Join Date
                </th>
                <th className="text-center py-3 px-2 md:py-6 md:px-6 font-black text-slate-500 italic">
                  Manage
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-white/5 rounded" />
                          <div className="h-3 w-20 bg-white/5 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-white/5 rounded" />
                        <div className="h-3 w-32 bg-white/5 rounded" />
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="h-6 w-20 bg-white/5 rounded-lg" />
                    </td>
                    <td className="py-6 px-6">
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex justify-center gap-2">
                        <div className="h-9 w-9 bg-white/5 rounded-xl" />
                        <div className="h-9 w-24 bg-white/5 rounded-xl" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                paginatedData.map((member) => {
                  const graceDays = store.businessSettings.gracePeriodDays || 0;
                  const subs = store.subscriptions.filter(
                    (s) => s.memberId === member.id
                  );
                  // 1. Check local history if available
                  let activeSub = subs.find((s) =>
                    isSubscriptionActive(s.endDate, s.status, graceDays)
                  );
                  // 2. Check injected status fallback
                  if (!activeSub && (member as any).activeSubscription) {
                    activeSub = (member as any).activeSubscription;
                  }

                  const isActive = !!activeSub;
                  const isPaused = activeSub?.status === "paused" || subs.some(s => s.status === "paused" && isSubscriptionActive(s.endDate, "active", graceDays));
                  const isGrace = isActive && activeSub && new Date(activeSub.endDate) < new Date();

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row"
                    >
                      <td className="py-3 px-2 md:py-6 md:px-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {member.photoBase64 ? (
                              <img
                                src={member.photoBase64 || "/placeholder.svg"}
                                alt={member.firstName}
                                className="w-10 h-10 rounded-xl object-cover grayscale group-hover/row:grayscale-0 transition-all border border-white/5"
                              />
                            ) : (
                              <div className="hidden md:flex w-10 h-10 rounded-xl bg-slate-900 border border-white/5  items-center justify-center text-primary font-black text-xs">
                                {member.firstName.charAt(0)}
                              </div>
                            )}
                            <div className="hidden md:flex absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-background border border-black/10 dark:border-white/10 items-center justify-center">
                              <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-primary" : "bg-red-500")} />
                            </div>
                          </div>
                          <div>
                            <span className="text-foreground font-black italic tracking-tighter text-sm md:text-lg block group-hover/row:text-primary transition-colors text-nowrap">
                              {member.firstName} <span className="hidden md:inline">{member.lastName || ""}</span>
                            </span>
                            <span className="hidden md:block text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">ID: {member.id.toUpperCase().slice(-8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 md:py-6 md:px-6">
                        <div className="space-y-1">
                          <div className="text-foreground font-mono text-nowrap text-[10px] font-normal">{member.phone}</div>
                          <div className="text-slate-500 text-[9px] font-mono lowercase hidden md:block">
                            {member.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 md:py-6 md:px-6 text-center">
                        <div className={cn(
                          "inline-flex items-center justify-center p-2 rounded-lg border",
                          isPaused
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                            : isGrace
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                              : isActive
                                ? "bg-primary/10 border-primary/20 text-primary"
                                : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                          {isPaused ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : isGrace ? <AlertCircle className="w-4 h-4 text-orange-500" /> : isActive ? <CircleCheckBigIcon className="w-4 h-4 text-primary" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-2 md:py-6 md:px-6 text-slate-500 font-mono text-[10px] text-nowrap hidden md:table-cell">
                        {formatDate(member.joinDate).toUpperCase()}
                      </td>
                      <td className="py-3 px-2 md:py-6 md:px-6">
                        <div className="flex gap-2 items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!canScan) {
                                toast("Premium Feature", {
                                  description: "QR Code scanning is a premium feature.",
                                  action: {
                                    label: "Upgrade",
                                    onClick: () => {
                                      // router.push("/plans");
                                    },
                                  },
                                });
                                return;
                              }
                              setQrMember({
                                id: member.id,
                                name: `${member.firstName} ${member.lastName || ""}`,
                              });
                            }}
                            className={cn(
                              "h-9 w-9 rounded-xl border border-white/5 bg-white/5 transition-all text-slate-400 hover:text-primary hover:border-primary/50",
                              !canScan && "opacity-20 grayscale"
                            )}
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>

                          {showTrash && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestore(member.id)}
                              className="h-9 px-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-black italic text-[10px] tracking-tighter"
                            >
                              Restore
                            </Button>
                          )}

                          {!showTrash && (
                            <Link href={`/members/${member.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-white font-black italic text-[10px] tracking-tighter hover:bg-primary hover:text-black transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="read-only:hidden md:block">View Profile</span>
                              </Button>
                            </Link>
                          )}
                          {['owner', 'gym_owner', 'super_admin', 'manager'].includes((session?.user as any)?.role) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(member.id)}
                              className={cn(
                                "h-9 w-9 rounded-xl border transition-all",
                                showTrash
                                  ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                                  : "border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white"
                              )}
                              title={showTrash ? "Permanently Delete" : "Move to Trash"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && !loading && (
          <div className="text-center py-24 bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No members found</p>
          </div>
        )}

        <PaginationHUD
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* QR Code Dialog */}
      {qrMember && (
        <MemberQrDialog
          open={!!qrMember}
          onOpenChange={(open) => !open && setQrMember(null)}
          memberId={qrMember.id}
          memberName={qrMember.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmModal
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title={showTrash ? "Permanently Purge" : "Delete"}
        highlight="Member?"
        description={showTrash
          ? "This is a destructive action and cannot be undone. All membership history, payments, and personal data will be wiped forever."
          : "The member record and their history will be moved to the trash and hidden from the registry."
        }
        onConfirm={() => deleteId && handleDelete(deleteId)}
        confirmText={showTrash ? "Delete" : "Move to Trash"}
        variant="destructive"
      />
    </div>
  );
}
