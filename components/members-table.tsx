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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { PremiumButton } from "@/components/ui/premium-button";

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
    <div className="rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/10 after:to-transparent">
      <Table className="!text-xs md:text-sm">
        <TableHeader className="bg-white/[0.02]">
          <TableRow className="border-b border-white/5 hover:bg-transparent [&_th]:py-3 [&_th]:md:py-6 [&_th]:px-3 [&_th]:md:px-6">
            <TableHead className="text-left font-black text-slate-500 italic uppercase tracking-[0.2em] text-[11px] h-auto">
              Member Name
            </TableHead>
            <TableHead className="hidden lg:table-cell text-left font-black text-slate-500 italic uppercase tracking-[0.2em] text-[11px] h-auto">
              Join Date
            </TableHead>
            <TableHead className="hidden sm:table-cell text-left font-black text-slate-500 italic uppercase tracking-[0.2em] text-[11px] h-auto">
              Renewal Date
            </TableHead>
            <TableHead className="text-left font-black text-slate-500 italic uppercase tracking-[0.2em] text-[11px] h-auto">
              Status
            </TableHead>
            <TableHead className="text-center font-black text-slate-500 italic uppercase tracking-[0.2em] text-[11px] h-auto">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayMembers.length > 0 ? (
            displayMembers.map((item) => (
              <TableRow
                key={item.member.id}
                className="[&_td]:py-3 [&_td]:md:py-6 [&_td]:px-3 [&_td]:md:px-6 border-white/5 hover:bg-white/[0.02] transition-colors group/row"
              >
                <TableCell className="font-black italic tracking-tighter text-base">
                  {item.member.firstName} {item.member.lastName || ""}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-slate-500 font-mono text-[10px] uppercase">
                  {formatDate(item.member.joinDate)}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-slate-500 font-mono text-[10px] uppercase">
                  {item.subscription
                    ? formatDate(item.subscription.endDate)
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status as any} />
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/members/${item.member.id}`}>
                    <PremiumButton>
                      {trainerOnly ? "View" : "Renew"}
                    </PremiumButton>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-8 text-center text-[10px] font-black italic uppercase tracking-widest text-slate-500"
              >
                No members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
