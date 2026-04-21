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
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Clock,
  Globe,
  User,
  Box,
  Activity,
  Terminal,
  Calendar,
  Layers,
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
  "member",
  "subscription",
  "payment",
  "plan",
  "attendance",
  "user",
  "branch",
  "settings",
  "gym",
];

// Action types from AuditLog model
const ACTIONS = [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "pause_subscription",
  "resume_subscription",
  "checkin",
  "checkout",
  "role_change",
  "export_data",
  "enable_portal",
  "disable_portal",
];

export default function AuditlogsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [resource, setResource] = useState(
    searchParams.get("resource") || "all",
  );
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
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
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
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleApplyFilters = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleResetFilters = () => {
    setResource("all");
    setAction("all");
    setUserId("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const getActionColor = (action: string) => {
    if (action.includes("create"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (action.includes("update"))
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    if (action.includes("delete"))
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    if (action.includes("subscription"))
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
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
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
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
          <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
            FILTER
          </span>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-2">
          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger className="h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
              <span className="text-slate-500 mr-2">Resource:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
              <SelectItem
                value="all"
                className="text-[10px] font-bold italic uppercase"
              >
                All Types
              </SelectItem>
              {RESOURCES.map((r) => (
                <SelectItem
                  key={r}
                  value={r}
                  className="text-[10px] font-bold italic uppercase"
                >
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider transition-all focus:ring-0">
              <span className="text-slate-500 mr-2">Action:</span>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="glass-premium border-white/10 bg-slate-950/95">
              <SelectItem
                value="all"
                className="text-[10px] font-bold italic uppercase"
              >
                All Actions
              </SelectItem>
              {ACTIONS.map((a) => (
                <SelectItem
                  key={a}
                  value={a}
                  className="text-[10px] font-bold italic uppercase"
                >
                  {a.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase italic">
              Search:
            </div>
            <InputField
              placeholder=""
              value={userId}
              onChange={(val) => setUserId(val)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              className="!pl-16 h-9 bg-transparent border-none hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase italic tracking-wider pl-8 w-full focus:ring-0"
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
                <TableHead className="w-[150px] text-[10px] font-black uppercase italic tracking-widest py-2">
                  TIME
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">
                  USER
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">
                  ACTION
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">
                  TARGET
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase italic tracking-widest py-2">
                  DETAILS
                </TableHead>
                <TableHead className="w-[80px] text-[10px] font-black uppercase italic tracking-widest py-2 text-right">
                  VIEW
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell className="py-4">
                      <div className="h-3 w-28 bg-white/5 rounded" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-white/5 rounded" />
                        <div className="h-2 w-16 bg-white/5 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="h-5 w-20 bg-white/5 rounded" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-white/5 rounded" />
                        <div className="h-2 w-28 bg-white/5 rounded" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="h-3 w-32 bg-white/5 rounded" />
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="h-7 w-7 bg-white/5 rounded-md ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No logs found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <TableCell className="font-mono text-[10px] whitespace-nowrap py-2 text-slate-400 group-hover:text-primary transition-colors">
                      {format(new Date(log.createdAt), "MM.dd.yy // HH:mm:ss")}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase italic tracking-tight text-foreground">
                          {log.userName || "System"}
                        </span>
                        <span
                          className="text-[9px] font-mono text-slate-500 truncate max-w-[100px]"
                          title={log.userId}
                        >
                          {log.userId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        className={cn(
                          "text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-md",
                          getActionColor(log.action),
                        )}
                        variant="outline"
                      >
                        {log.action.replace("_", ":")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-slate-300">
                          {log.resource}
                        </span>
                        {log.resourceName && (
                          <span
                            className="text-[9px] text-slate-500 truncate max-w-[120px] italic"
                            title={log.resourceName}
                          >
                            {log.resourceName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-[9px] text-slate-500 font-mono py-2">
                      {JSON.stringify(log.details || {})}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md"
                      >
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
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total)
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
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0 gap-0 overflow-hidden glass-premium border-white/10 bg-slate-950/95 shadow-2xl focus:ring-0 outline-none">
          {/* Header */}
          <div className="flex-none p-6 border-b border-white/10 bg-white/[0.02]">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white leading-none mb-1.5">
                      AUDIT <span className="text-primary">TRACE</span>
                    </DialogTitle>
                    <DialogDescription className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      ID: {selectedLog?.id}
                    </DialogDescription>
                  </div>
                </div>
                {selectedLog && (
                  <Badge variant="outline" className={cn(
                    "h-6 px-3 text-[10px] font-black italic uppercase tracking-widest border-primary/20 bg-primary/5 text-primary",
                    getActionColor(selectedLog.action)
                  )}>
                    {selectedLog.action.replace("_", ":")}
                  </Badge>
                )}
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {selectedLog && (
              <>
                {/* Unified Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10overflow-hidden">
                  <div className="p-4 bg-slate-950/40 backdrop-blur-sm flex gap-4 items-start hover:bg-white/[0.02] transition-colors">
                    <Calendar className="w-4 h-4 text-primary/60 mt-1" />
                    <div>
                      <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-1">OCCURRED AT</h4>
                      <p className="font-mono text-xs text-slate-200">{format(new Date(selectedLog.createdAt), "MMM d, yyyy // HH:mm:ss")}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/60 backdrop-blur-sm flex gap-4 items-start hover:bg-white/[0.02] transition-colors">
                    <Globe className="w-4 h-4 text-primary/60 mt-1" />
                    <div>
                      <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-1">NETWORK ORIGIN</h4>
                      <p className="font-mono text-xs text-slate-200">{selectedLog.ipAddress || "SYSTEM_INTERNAL"}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/60 backdrop-blur-sm flex gap-4 items-start hover:bg-white/[0.02] transition-colors">
                    <User className="w-4 h-4 text-primary/60 mt-1" />
                    <div>
                      <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-1">INITIATOR</h4>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-black italic uppercase text-xs text-slate-200">{selectedLog.userName}</p>
                        {(selectedLog as any).userRole && (
                          <Badge variant="outline" className="text-[8px] h-4 px-1 border-primary/20 text-primary/80 font-black italic uppercase tracking-tighter">
                            {(selectedLog as any).userRole}
                          </Badge>
                        )}
                      </div>
                      <p className="font-mono text-[9px] text-slate-500">ID: {selectedLog.userId}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/40 backdrop-blur-sm flex gap-4 items-start hover:bg-white/[0.02] transition-colors">
                    <Layers className="w-4 h-4 text-primary/60 mt-1" />
                    <div>
                      <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 mb-1">TARGET RESOURCE</h4>
                      <p className="font-black italic uppercase text-xs text-slate-200 mb-0.5">{selectedLog.resource}</p>
                      <p className="font-mono text-[9px] text-slate-500 truncate max-w-[150px]">ID: {selectedLog.resourceId}</p>
                    </div>
                  </div>
                </div>

                {/* User Agent - Compact */}
                {selectedLog.userAgent && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                      <Terminal className="w-3.5 h-3.5 text-primary/50" />
                      <h4 className="text-[10px] font-black italic uppercase tracking-widest text-slate-500">ENVIRONMENT</h4>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 break-all leading-relaxed relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                      {selectedLog.userAgent}
                    </p>
                    <div className="absolute top-0 right-0 p-8 bg-primary/5 blur-3xl rounded-full -mr-4 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}

                {/* Data Payload Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-primary" />
                      <h4 className="text-[12px] font-black italic uppercase tracking-tighter text-white">
                        DATA <span className="text-primary">PAYLOAD</span>
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-px w-8 bg-white/10" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">application/json</span>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/20 to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-black/60 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="max-h-[300px] overflow-auto custom-scrollbar p-5">
                        <pre className="text-[11px] font-mono leading-relaxed text-primary/90 whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer - Optional */}
          <div className="flex-none p-4 border-t border-white/10 bg-white/[0.01] flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setSelectedLog(null)}
              className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 hover:text-white"
            >
              Close Trace
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
