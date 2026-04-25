"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  isSubscriptionActive,
  formatDate,
  daysUntilExpiry,
} from "@/lib/utils/file-utils";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MembersTable({ 
  trainerOnly = false, 
  mode = "recent" 
}: { 
  trainerOnly?: boolean,
  mode?: "recent" | "expiring"
}) {
  const store = useAppStore();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    store.loadMembers();
    store.loadSubscriptions();
  }, []);

  const relevantMembers = useMemo(() => {
    let list = store.members;
    if (trainerOnly && userId) {
      list = list.filter(m => (m as any).trainerId === userId || (m as any).trainerId?._id === userId);
    }
    return list;
  }, [store.members, trainerOnly, userId]);

  const displayMembers = useMemo(() => {
    let filtered = relevantMembers
      .filter((member) => {
        if (!store.searchQuery) return true;
        const lower = store.searchQuery.toLowerCase();
        return (
          `${member.firstName} ${member.lastName || ""}`.toLowerCase().includes(lower) ||
          (member.phone || "").includes(store.searchQuery) ||
          (member.email || "").toLowerCase().includes(lower)
        );
      })
      .map((member) => {
        const subs = store.subscriptions.filter(
          (s) => s.memberId === member.id
        );

        let activeSub = subs.find((s) => isSubscriptionActive(s.endDate, s.status));
        if (!activeSub && (member as any).activeSubscription) {
          activeSub = (member as any).activeSubscription;
        }

        const daysLeft = activeSub ? daysUntilExpiry(activeSub.endDate) : -1;
        const latestSubInHistory = [...subs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
        const isPaused = activeSub?.status === "paused" || latestSubInHistory?.status === "paused";

        if (isPaused) {
          return { member, subscription: activeSub, status: "paused" as const, daysLeft: -1 };
        }

        return {
          member,
          subscription: activeSub,
          daysLeft,
          status:
            daysLeft >= 0 && daysLeft <= 7
              ? ("expiring" as const)
              : daysLeft > 7
                ? ("active" as const)
                : ("expired" as const),
        };
      });

    if (mode === "expiring") {
      filtered = filtered.filter(item => item.status === "expiring" || item.status === "expired");
      filtered.sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));
    } else {
      filtered.sort((a, b) => new Date(b.member.joinDate).getTime() - new Date(a.member.joinDate).getTime());
    }

    return filtered.slice(0, 10);
  }, [relevantMembers, store.subscriptions, store.searchQuery, mode]);

  return (
    <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
      <div className="overflow-x-auto">
        <Table className="w-full text-sm border-none">
          <TableHeader className="border-b border-white/5 bg-white/[0.02]">
            <TableRow className="border-none hover:bg-transparent transition-none">
              <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Member Name
              </TableHead>
              <TableHead className="hidden lg:table-cell text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Join Date
              </TableHead>
              <TableHead className="hidden sm:table-cell text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Renewal Date
              </TableHead>
              <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Status
              </TableHead>
              <TableHead className="text-center py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayMembers.length > 0 ? (
              displayMembers.map((item) => (
                <TableRow
                  key={item.member.id}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row"
                >
                  <TableCell className="py-6 px-6 font-black italic tracking-tighter text-base">
                    {item.member.firstName} {item.member.lastName || ""}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-6 px-6 text-slate-500 font-mono text-[10px] uppercase">
                    {formatDate(item.member.joinDate)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-6 px-6 text-slate-500 font-mono text-[10px] uppercase">
                    {item.subscription
                      ? formatDate(item.subscription.endDate)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-6 px-6">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black italic tracking-widest uppercase",
                            item.status === "active"
                              ? "bg-primary/10 border-primary/20 text-primary"
                              : item.status === "expiring"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : item.status === "paused"
                                  ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                  : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          )}
                        >
                          <div className={cn(
                            "w-1 h-1 rounded-full",
                            item.status === "active" ? "bg-primary" : item.status === "expiring" ? "bg-amber-500" : item.status === "paused" ? "bg-blue-500" : "bg-rose-500"
                          )} />
                          {item.status === "active" ? "Active" : item.status === "expiring" ? "Exp Soon" : item.status === "paused" ? "Paused" : "Expired"}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="font-black italic uppercase tracking-widest text-[9px] bg-card border-border text-foreground">
                        Subscription Status
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="py-6 px-6 text-center">
                    <Link href={`/members/${item.member.id}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-white font-black italic text-[10px] tracking-tighter hover:bg-primary hover:text-black transition-all uppercase">
                            {trainerOnly ? "View" : "Renew"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="font-black italic uppercase tracking-widest text-[9px] bg-card border-border text-foreground">
                          {trainerOnly ? "Member Details" : "Renew Membership"}
                        </TooltipContent>
                      </Tooltip>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
