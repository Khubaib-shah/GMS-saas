"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AuditLogEntry } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Resource types from AuditLog model
const RESOURCES = [
  'member',
  'subscription',
  'payment',
  'plan',
  'attendance',
  'user',
  'branch',
  'settings',
  'gym'
];

// Action types from AuditLog model
const ACTIONS = [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'pause_subscription',
  'resume_subscription',
  'checkin',
  'checkout',
  'role_change',
  'export_data',
  'enable_portal',
  'disable_portal'
];

export default function AuditLogsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Filters
  const [resource, setResource] = useState(searchParams.get("resource") || "all");
  const [action, setAction] = useState(searchParams.get("action") || "all");
  const [userId, setUserId] = useState(searchParams.get("userId") || "");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      if (resource && resource !== "all") params.set("resource", resource);
      if (action && action !== "all") params.set("action", action);
      if (userId) params.set("userId", userId);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 403) {
          toast.error("You don't have permission to view audit logs");
          // Optionally redirect, or just show empty state
          setLogs([]);
          return;
        }
        throw new Error("Failed to fetch logs");
      }

      const data = await res.json();
      setLogs(data.logs);
      setPagination(prev => ({
        ...prev,
        ...data.pagination
      }));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, resource, action]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleResetFilters = () => {
    setResource("all");
    setAction("all");
    setUserId("");
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action: string) => {
    if (action.includes("create")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (action.includes("update")) return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    if (action.includes("delete")) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (action.includes("subscription")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track system activity and user actions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter logs by resource, action, or user</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resource</label>
              <Select value={resource} onValueChange={setResource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {RESOURCES.map(r => (
                    <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTIONS.map(a => (
                    <SelectItem key={a} value={a}>{a.replace('_', ' ').charAt(0).toUpperCase() + a.replace('_', ' ').slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by User ID..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button variant="ghost" onClick={handleResetFilters} title="Reset Filters">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-3">
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date & Time</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <span className="sr-only">Loading...</span>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No logs found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{log.userName || "Unknown"}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={log.userId}>
                          {log.userId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize font-normal whitespace-nowrap", getActionColor(log.action))} variant="outline">
                        {log.action.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize">{log.resource}</span>
                        {log.resourceName && (
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]" title={log.resourceName}>
                            {log.resourceName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                      {JSON.stringify(log.details || {})}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-2 border-t">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Action ID: {selectedLog?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Timestamp</h4>
                  <p className="text-sm">{format(new Date(selectedLog.createdAt), "PPP pp")}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">IP Address</h4>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">User</h4>
                  <p className="text-sm">{selectedLog.userName} <span className="text-xs text-muted-foreground">({selectedLog.userId})</span></p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Resource</h4>
                  <p className="capitalize text-sm">{selectedLog.resource} <span className="text-xs text-muted-foreground">({selectedLog.resourceId})</span></p>
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">User Agent</h4>
                    <p className="text-xs text-muted-foreground break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Change Details (JSON)</h4>
                <div className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs font-mono">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
