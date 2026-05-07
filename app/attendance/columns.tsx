"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AttendanceColumn = {
    id: string;
    memberName: string;
    memberId: string;
    checkInTime: string;
    checkOutTime: string | null;
    status: string;
};

export const columns: ColumnDef<AttendanceColumn>[] = [
    {
        accessorKey: "memberName",
        header: "Member",
        cell: ({ row }) => (
            <span className="font-medium md:font-black text-foreground tracking-tighter">
                {row.original.memberName}
            </span>
        ),
    },
    {
        accessorKey: "checkInTime",
        header: "Check In",
        cell: ({ row }) => (
            <span className="font-mono text-primary">
                {row.original.checkInTime ? new Date(row.original.checkInTime).toLocaleTimeString() : "-"}
            </span>
        ),
    },
    {
        accessorKey: "checkOutTime",
        header: "Check Out",
        cell: ({ row }) => (
            <span className="font-mono text-slate-500">
                {row.original.checkOutTime ? new Date(row.original.checkOutTime).toLocaleTimeString() : "-"}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border border-primary/20">
                {row.original.status.toUpperCase()}
            </span>
        ),
    },
    {
        id: "actions",
        header: () => <div className="text-right">View</div>,
        cell: ({ row }) => (
            <div className="text-right">
                <Link href={`/members/${row.original.memberId}`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-xl border border-white/5 bg-white/5 text-slate-400 hover:text-primary hover:border-primary/50 transition-all"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        ),
    },
];
