"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Payment, Member } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/file-utils";

export type PaymentColumn = Payment & {
    memberName: string;
};

export const createColumns = (members: Member[]): ColumnDef<PaymentColumn>[] => [
    {
        accessorKey: "memberName",
        header: "Member",
        cell: ({ row }) => (
            <span className="text-foreground font-black italic tracking-tighter text-base block group-hover/row:text-primary transition-colors">
                {row.original.memberName}
            </span>
        ),
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
            <span className="font-black text-primary text-base">
                {formatCurrency(row.original.amount)}
            </span>
        ),
    },
    {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
            <span className="text-slate-500 font-mono text-[10px] whitespace-nowrap">
                {formatDate(row.original.date).toUpperCase()}
            </span>
        ),
    },
    {
        accessorKey: "method",
        header: "Method",
        cell: ({ row }) => (
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] font-black tracking-widest italic group-hover/row:border-primary/20 transition-all">
                {row.original.method.toUpperCase()}
            </div>
        ),
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
            <span className="text-slate-500 font-mono text-[9px] lowercase max-w-xs truncate block">
                {row.original.description}
            </span>
        ),
    },
];
