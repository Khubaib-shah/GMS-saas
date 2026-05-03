"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AuditLogEntry } from "@/lib/types";

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

export const columns = (onViewDetails: (log: AuditLogEntry) => void): ColumnDef<AuditLogEntry>[] => [
    {
        accessorKey: "createdAt",
        header: "Time",
        cell: ({ row }) => (
            <span className="font-mono text-[10px] whitespace-nowrap text-slate-400 group-hover:text-primary transition-colors">
                {format(new Date(row.original.createdAt), "MM.dd.yy // HH:mm:ss")}
            </span>
        ),
    },
    {
        accessorKey: "userName",
        header: "User",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase italic tracking-tight text-foreground">
                    {row.original.userName || "System"}
                </span>
                <span className="text-[9px] font-mono text-slate-500 truncate max-w-[100px]">
                    {row.original.userId}
                </span>
            </div>
        ),
    },
    {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) => (
            <Badge
                className={cn(
                    "text-[9px] font-black uppercase tracking-widest h-5 px-2 rounded-md",
                    getActionColor(row.original.action),
                )}
                variant="outline"
            >
                {row.original.action.replace("_", ":")}
            </Badge>
        ),
    },
    {
        accessorKey: "resource",
        header: "Target",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase text-slate-300">
                    {row.original.resource}
                </span>
                {row.original.resourceName && (
                    <span className="text-[9px] text-slate-500 truncate max-w-[120px] italic">
                        {row.original.resourceName}
                    </span>
                )}
            </div>
        ),
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
            <span className="max-w-[150px] truncate text-[9px] text-slate-500 font-mono block">
                {JSON.stringify(row.original.details || {})}
            </span>
        ),
    },
    {
        id: "actions",
        header: () => <div className="text-right">View</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(row.original)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-md"
                >
                    <Eye className="h-3.5 w-3.5" />
                </Button>
            </div>
        ),
    },
];
