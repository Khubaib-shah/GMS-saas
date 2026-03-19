"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, Plus, Trash2, QrCode, Sparkles, Users } from "lucide-react";
import { MemberQrDialog } from "@/components/member-qr-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { isSubscriptionActive, formatDate } from "@/lib/utils/file-utils";
import { toast } from "sonner";

export default function MembersPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as any)?.isPremium;
  const store = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qrMember, setQrMember] = useState<{ id: string; name: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        store.loadMembers(),
        store.loadSubscriptions()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

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
        // 1. Check local subscriptions first (for managers/owners)
        const subs = store.subscriptions.filter((s) => s.memberId === m.id);
        let isActive = subs.some((s) => isSubscriptionActive(s.endDate, s.status));

        // 2. Fallback to injected status (for trainers)
        if (!isActive && (m as any).activeSubscription) {
          isActive = isSubscriptionActive((m as any).activeSubscription.endDate, (m as any).activeSubscription.status);
        }

        return filterStatus === "active" ? isActive : !isActive;
      });
    }

    return result;
  }, [store.members, store.subscriptions, store.searchQuery, searchTerm, filterStatus, session]);

  const handleDelete = async (id: string) => {
    await store.deleteMember(id);
    setDeleteId(null);
    toast.success("Member deleted successfully");
  };

  return (
    <div className="space-y-10 animate-fade-up">
      {/* HUD HEADER */}
      <div className="flex items-center justify-between mb-12 relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">DIRECTORY: MEMBER_LIST_v4</span>
            <div className="h-px w-24 bg-black/5 dark:bg-white/5"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
            MEMBER <span className="text-primary neon-text">DIRECTORY</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
            Member database and subscription management active.
          </p>
        </div>
        {((session?.user as any)?.role !== 'trainer') && (
          <Link href="/members/add">
            <Button className="h-14 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              ADD NEW MEMBER
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter - Bento Style */}
      <div className="glass-premium p-8 mb-8 border-border">
        <div className="flex gap-8 items-end flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
              SEARCH_MEMBERS
            </label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="BY NAME, EMAIL OR PHONE..."
                value={searchTerm || store.searchQuery}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  store.setSearchQuery(e.target.value);
                }}
                className="pl-12 h-12 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">
              STATUS_FILTER
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "active" | "expired")
              }
              className="h-12 px-6 rounded-xl border-transparent bg-white/5 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              <option value="all">ALL_MEMBERS</option>
              <option value="active">ACTIVE_MEMBERS</option>
              <option value="expired">EXPIRED_MEMBERS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-bold tracking-widest uppercase">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">
                  MEMBER_IDENTIFIER
                </th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">
                  CONTACT_INFO
                </th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">
                  SUBSCRIPTION_STATUS
                </th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">
                  JOIN_DATE
                </th>
                <th className="text-center py-6 px-6 font-black text-slate-500 italic">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const subs = store.subscriptions.filter(
                  (s) => s.memberId === member.id
                );
                // 1. Check local history if available
                let activeSub = subs.find((s) =>
                  isSubscriptionActive(s.endDate, s.status)
                );
                // 2. Check injected status fallback
                if (!activeSub && (member as any).activeSubscription) {
                  activeSub = (member as any).activeSubscription;
                }

                const isActive = !!activeSub;
                const isPaused = activeSub?.status === "paused" || subs.some(s => s.status === "paused" && isSubscriptionActive(s.endDate));

                return (
                  <tr
                    key={member.id}
                    className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row"
                  >
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {member.photoBase64 ? (
                            <img
                              src={member.photoBase64 || "/placeholder.svg"}
                              alt={member.firstName}
                              className="w-10 h-10 rounded-xl object-cover grayscale group-hover/row:grayscale-0 transition-all border border-white/5"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-primary font-black text-xs">
                              {member.firstName.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-background border border-black/10 dark:border-white/10 flex items-center justify-center">
                            <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-primary" : "bg-red-500")} />
                          </div>
                        </div>
                        <div>
                          <span className="text-foreground font-black italic tracking-tighter text-base block group-hover/row:text-primary transition-colors">
                            {member.firstName} {member.lastName || ""}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5 block">MEMBER_ID: {member.id.toUpperCase().slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="space-y-1">
                        <div className="text-foreground font-mono text-[10px]">{member.phone}</div>
                        <div className="text-slate-500 text-[9px] font-mono lowercase">
                          {member.email}
                        </div>
                      </div>
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
                    </td>
                    <td className="py-6 px-6 text-slate-500 font-mono text-[10px]">
                      {formatDate(member.joinDate).toUpperCase()}
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex gap-2 items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (!isPremium) {
                              toast("PREMIUM_RESTRICTION", {
                                description: "QR CRYPTOGRAPHIC PROTOCOLS REQUIRE PREMIUM ACCESS.",
                                action: {
                                  label: "UPGRADE",
                                  onClick: () => { },
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
                            !isPremium && "opacity-20 grayscale"
                          )}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Link href={`/members/${member.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-white font-black italic text-[10px] tracking-tighter hover:bg-primary hover:text-black transition-all"
                          >
                            VIEW PROFILE
                          </Button>
                        </Link>

                        {['owner', 'gym_owner', 'super_admin', 'manager'].includes((session?.user as any)?.role) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(member.id)}
                            className="h-9 w-9 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-24 bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">NO_MEMBERS_FOUND</p>
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
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The member will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
