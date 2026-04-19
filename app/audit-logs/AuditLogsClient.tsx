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
import { InputField } from "@/components/ui/input-field";
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
import { DashboardHeader } from "@/components/dashboard-header";
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
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="ACTIVITY"
        highlight="HISTORY"
        subtitle="Track your gym's activity"
        description="See everything that happens in your gym"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchLogs}
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black italic tracking-tighter transition-all"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            REFRESH
          </Button>
          <Button
            variant="outline"
            className="h-12 px-6 rounded-xl bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 font-black italic tracking-tighter transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            EXPORT
          </Button>
        </div>
      </DashboardHeader>

      {/* ULTRA-COMPACT FILTERS HUD */}
      <div className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-6 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
          <Filter className="w-3.5 h-3.5 text-primary/50" />
          <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">FILTER</span>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger className="h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
              <span className="text-slate-500 mr-2">Resource:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
              <SelectItem value="all" className="text-[10px] font-bold italic uppercase">All Types</SelectItem>
              {RESOURCES.map(r => (
                <SelectItem key={r} value={r} className="text-[10px] font-bold italic uppercase">{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
              <span className="text-slate-500 mr-2">Action:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
              <SelectItem value="all" className="text-[10px] font-bold italic uppercase">All Actions</SelectItem>
              {ACTIONS.map(a => (
                <SelectItem key={a} value={a} className="text-[10px] font-bold italic uppercase">{a.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase italic">Search:</div>
            <InputField
              placeholder="Search records..."
              value={userId}
              onChange={(val) => setUserId(val)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider pl-8 w-full focus:ring-0"
              hideLabel
            />
          </div>
        </div>

        <div className="flex gap-1 pl-2 border-l border-white/10">
          <Button 
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-[10px] rounded-lg neon-glow"
          >
            Apply
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleResetFilters}
            className="h-9 w-9 text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-xl border-t-0 -mt-1 relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent">
        <div>
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 bg-white/[0.02]">
                <TableHead className="w-[150px] text-[10px] font-black uppercase italic tracking-widest py-2">TIME</TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">USER</TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">ACTION</TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">TARGET</TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">DETAILS</TableHead>
                <TableHead className="w-[80px] text-[10px] font-black uppercase italic tracking-widest py-2 text-right">VIEW</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 15 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell className="py-4"><div className="h-3 w-28 bg-white/5 rounded" /></TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-white/5 rounded" />
                        <div className="h-2 w-16 bg-white/5 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4"><div className="h-5 w-20 bg-white/5 rounded" /></TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-white/5 rounded" />
                        <div className="h-2 w-28 bg-white/5 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4"><div className="h-3 w-32 bg-white/5 rounded" /></TableCell>
                    <TableCell className="py-4 text-right"><div className="h-7 w-7 bg-white/5 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No logs found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <TableCell className="font-mono text-[10px] whitespace-nowrap py-2 text-slate-400 group-hover:text-primary transition-colors">
                      {format(new Date(log.createdAt), "MM.dd.yy // HH:mm:ss")}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase italic tracking-tight text-foreground">{log.userName || "System"}</span>
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-[100px]" title={log.userId}>
                          {log.userId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge className={cn("text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-md", getActionColor(log.action))} variant="outline">
                        {log.action.replace('_', ':')}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-slate-300">{log.resource}</span>
                        {log.resourceName && (
                          <span className="text-[9px] text-slate-500 truncate max-w-[120px] italic" title={log.resourceName}>
                            {log.resourceName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-[9px] text-slate-500 font-mono py-2">
                      {JSON.stringify(log.details || {})}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)} className="h-7 w-7 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md">
                        <Eye className="h-3.5 w-3.5" />
                        <span className="sr-only">View Details</span>
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
