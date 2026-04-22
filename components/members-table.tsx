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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Member Name
              </th>
              <th className="hidden lg:table-cell text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Join Date
              </th>
              <th className="hidden sm:table-cell text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Renewal Date
              </th>
              <th className="text-left py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Status
              </th>
              <th className="text-center py-6 px-6 font-black text-slate-500 italic uppercase tracking-widest text-[11px]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {displayMembers.length > 0 ? (
              displayMembers.map((item) => (
                <tr
                  key={item.member.id}
                  className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row"
                >
                  <td className="py-6 px-6 font-black italic tracking-tighter text-base">
                    {item.member.firstName} {item.member.lastName || ""}
                  </td>
                  <td className="hidden lg:table-cell py-6 px-6 text-slate-500 font-mono text-[10px] uppercase">
                    {formatDate(item.member.joinDate)}
                  </td>
                  <td className="hidden sm:table-cell py-6 px-6 text-slate-500 font-mono text-[10px] uppercase">
                    {item.subscription
                      ? formatDate(item.subscription.endDate)
                      : "—"}
                  </td>
                  <td className="py-6 px-6">
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
                  </td>
                  <td className="py-6 px-6 text-center">
                    <Link href={`/members/${item.member.id}`}>
                      <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-white/5 bg-white/5 text-white font-black italic text-[10px] tracking-tighter hover:bg-primary hover:text-black transition-all uppercase">
                        {trainerOnly ? "View" : "Renew"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
