"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Trash2 } from "lucide-react";
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
  const store = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expired"
  >("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.loadMembers();
    store.loadSubscriptions();
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    let result = store.members;
    const currentSearch = store.searchQuery || searchTerm;
    
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
        const subs = store.subscriptions.filter((s) => s.memberId === m.id);
        const active = subs.some((s) => isSubscriptionActive(s.endDate, s.status));
        return filterStatus === "active" ? active : !active;
      });
    }

    return result;
  }, [store.members, store.subscriptions, store.searchQuery, searchTerm, filterStatus]);

  const handleDelete = async (id: string) => {
    await store.deleteMember(id);
    setDeleteId(null);
    toast.success("Member deleted successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading members...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Members</h1>
          <p className="text-muted-foreground">
            Manage gym members and subscriptions
          </p>
        </div>
        <Link href="/members/add">
          <Button className="bg-primary text-primary-foreground hover:bg-accent gap-2">
            <Plus className="w-4 h-4" />
            Add Member
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <Card className="p-6 mb-6 bg-card">
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-foreground mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                value={searchTerm || store.searchQuery}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  store.setSearchQuery(e.target.value);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "active" | "expired")
              }
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              <option value="all">All Members</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Members Table */}
      <Card className="p-6 bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">
                Name
              </th>
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">
                Contact
              </th>
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">
                Status
              </th>
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">
                Joined
              </th>
              <th className="text-left py-4 px-4 font-semibold text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((member) => {
              const subs = store.subscriptions.filter(
                (s) => s.memberId === member.id
              );
              const activeSub = subs.find((s) =>
                isSubscriptionActive(s.endDate, s.status)
              );
              const isActive = !!activeSub;
              const isPaused = subs.some(s => s.status === "paused" && isSubscriptionActive(s.endDate));

              return (
                <tr
                  key={member.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {member.photoBase64 ? (
                        <img
                          src={member.photoBase64 || "/placeholder.svg"}
                          alt={member.firstName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-bold">
                          {member.firstName.charAt(0)}
                        </div>
                      )}
                      <span className="text-foreground font-medium">
                        {member.firstName} {member.lastName || ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <div className="text-foreground">{member.phone}</div>
                      <div className="text-muted-foreground text-xs">
                        {member.email}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        isPaused
                          ? "bg-amber-100 text-amber-700"
                          : isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}
                    >
                      {isPaused ? "Paused" : isActive ? "Active" : "Expired"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {formatDate(member.joinDate)}
                  </td>
                  <td className="py-4 px-4 space-x-2">
                    <Link href={`/members/${member.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="inline-block bg-transparent"
                      >
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(member.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No members found</p>
          </div>
        )}
      </Card>

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
