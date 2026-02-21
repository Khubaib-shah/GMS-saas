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

export function MembersTable({ trainerOnly = false }: { trainerOnly?: boolean }) {
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

  const expiringMembers = useMemo(() => {
    return relevantMembers
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
        const activeSub = subs.find((s) => isSubscriptionActive(s.endDate, s.status));
        const daysLeft = activeSub ? daysUntilExpiry(activeSub.endDate) : -1;

        const latestSub = [...subs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
        if (latestSub?.status === "paused") {
          return { member, subscription: null, daysLeft: -1, status: "active" as const };
        }

        return {
          member,
          subscription: activeSub,
          daysLeft,
          status:
            daysLeft > 0 && daysLeft <= 7
              ? ("expiring" as const)
              : daysLeft > 7
                ? ("active" as const)
                : ("expired" as const),
        };
      })
      .sort((a, b) => {
        // Priority: Expiring soon > Expired > Active
        if (a.status === "expiring" && b.status !== "expiring") return -1;
        if (a.status !== "expiring" && b.status === "expiring") return 1;
        if (a.status === "expired" && b.status === "active") return -1;
        if (a.status === "active" && b.status === "expired") return 1;
        return 0;
      })
      .slice(0, 10);
  }, [relevantMembers, store.subscriptions, store.searchQuery]);

  return (
    <Card className="p-6 bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Attention Needed ({expiringMembers.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Member Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Join Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Renewal Date
              </th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {expiringMembers.length > 0 ? (
              expiringMembers.map((item) => (
                <tr
                  key={item.member.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 text-foreground font-medium">
                    {item.member.firstName} {item.member.lastName || ""}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatDate(item.member.joinDate)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {item.subscription
                      ? formatDate(item.subscription.endDate)
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "px-3 py-1 w-full rounded-full text-xs font-medium",
                        item.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      )}
                    >
                      {item.status === "active"
                        ? "Active"
                        : item.status === "expiring"
                          ? "ExpSoon"
                          : "Expired"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/members/${item.member.id}`}>
                      <Button variant="outline" size="sm">
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
                  No members requiring attention
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
