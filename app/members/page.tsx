"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Plus, Trash2, QrCode, Sparkles, Users, Filter, Eye, AlertTriangle, CircleCheckBigIcon, AlertCircle, Loader2 } from "lucide-react";
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
import { DataTable } from "@/components/ui/data-table";
import { createColumns } from "./columns";

export default function MembersPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium;
  const store = useAppStore();
  const canScan = store.gymProfile?.enabledFeatures?.includes("qrAttendance") || store.gymProfile?.enabledFeatures?.includes("attendance");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrMember, setQrMember] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);
  const [isProcessingRestore, setIsProcessingRestore] = useState(false);
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
      setIsProcessingDelete(true);
      await store.deleteMember(id, { permanent: showTrash });
      setDeleteId(null);
      toast.success(showTrash ? "Member permanently deleted" : "Member moved to trash");
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsProcessingDelete(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      setIsProcessingRestore(true);
      await store.restoreMember(id);
      toast.success("Member successfully restored");
    } catch (error) {
      toast.error("Failed to restore member");
    } finally {
      setIsProcessingRestore(false);
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
      <div className="glass-premium p-6 border-border bg-card dark:bg-slate-950/40 rounded-3xl">
        {loading ? (
           <div className="space-y-4">
             {Array.from({ length: 5 }).map((_, i) => (
               <div key={i} className="h-16 w-full bg-white/5 animate-pulse rounded-xl" />
             ))}
           </div>
        ) : (
          <DataTable 
            columns={createColumns(
                canScan,
                (id, name) => setQrMember({ id, name }),
                (id) => setDeleteId(id),
                handleRestore,
                showTrash,
                isProcessingRestore,
                (session?.user as any)?.role
            )} 
            data={filtered.map(member => {
                const graceDays = store.businessSettings.gracePeriodDays || 0;
                const subs = store.subscriptions.filter(s => s.memberId === member.id);
                let activeSub = subs.find(s => isSubscriptionActive(s.endDate, s.status, graceDays));
                if (!activeSub && (member as any).activeSubscription) {
                    activeSub = (member as any).activeSubscription;
                }
                const isActive = !!activeSub;
                const isPaused = activeSub?.status === "paused" || subs.some(s => s.status === "paused" && isSubscriptionActive(s.endDate, "active", graceDays));
                const isGrace = !!(isActive && activeSub && new Date(activeSub.endDate) < new Date());

                return {
                    ...member,
                    isActive,
                    isPaused,
                    isGrace,
                    activeSub
                };
            })} 
            searchKey="firstName"
            searchPlaceholder="Filter by first name..."
          />
        )}
        
        {filtered.length === 0 && !loading && (
          <div className="text-center py-24 bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No members found</p>
          </div>
        )}
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
        loading={isProcessingDelete}
        confirmText={showTrash ? "Delete" : "Move to Trash"}
        variant="destructive"
      />
    </div>
  );
}
