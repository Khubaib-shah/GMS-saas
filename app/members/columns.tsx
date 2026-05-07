"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Member } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/file-utils";
import { QrCode, Eye, Trash2, AlertTriangle, AlertCircle, CircleCheckBigIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export type MemberColumn = Member & {
    isActive: boolean;
    isPaused: boolean;
    isGrace: boolean;
    activeSub: any;
};

export const createColumns = (
    canScan: boolean,
    onQrClick: (id: string, name: string) => void,
    onDeleteClick: (id: string) => void,
    onRestoreClick: (id: string) => void,
    showTrash: boolean,
    isProcessingRestore: boolean,
    userRole: string
): ColumnDef<MemberColumn>[] => [
        {
            accessorKey: "firstName",
            header: "Name",
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className="flex items-center gap-4 ">
                        <div className="relative">
                            {member.photoBase64 ? (
                                <img
                                    src={member.photoBase64}
                                    alt={member.firstName}
                                    className="w-10 h-10 rounded-xl object-cover grayscale group-hover/row:grayscale-0 transition-all border border-white/5"
                                />
                            ) : (
                                <div className="hidden md:flex w-10 h-10 rounded-xl bg-slate-900 border border-white/5 items-center justify-center text-primary font-black text-xs">
                                    {member.firstName.charAt(0)}
                                </div>
                            )}
                            <div className="hidden md:flex absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-background border border-black/10 dark:border-white/10 items-center justify-center">
                                <div className={cn("w-1.5 h-1.5 rounded-full", member.isActive ? "bg-primary" : "bg-red-500")} />
                            </div>
                        </div>
                        <div>
                            <span className="text-foreground font-medium md:font-black tracking-tighter text-sm md:text-lg block group-hover/row:text-primary transition-colors text-nowrap">
                                {member.firstName} <span className="hidden md:inline">{member.lastName || ""}</span>
                            </span>
                            <span className="hidden md:block text-[9px] text-slate-500 font-mono tracking-widest mt-0.5 uppercase">
                                ID: {member.id.toUpperCase().slice(-8)}
                            </span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "phone",
            header: "Contact Info",
            cell: ({ row }) => (
                <div className="space-y-1">
                    <div className="text-foreground font-mono text-nowrap text-[10px] font-normal">{row.original.phone}</div>
                    <div className="text-slate-500 text-[9px] font-mono lowercase hidden md:block">
                        {row.original.email}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "isActive",
            header: "Subscription",
            meta: { align: "center" },
            cell: ({ row }) => {
                const { isPaused, isGrace, isActive } = row.original;
                return (
                    <div className="flex justify-center">
                        <div className={cn(
                            "inline-flex items-center justify-center p-2 rounded-lg border",
                            isPaused
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                : isGrace
                                    ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                                    : isActive
                                        ? "bg-primary/10 border-primary/20 text-primary"
                                        : "bg-red-500/10 border-red-500/20 text-red-500"
                        )}>
                            {isPaused ? <AlertTriangle className="w-4 h-4" /> : isGrace ? <AlertCircle className="w-4 h-4" /> : isActive ? <CircleCheckBigIcon className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "joinDate",
            header: "Join Date",
            meta: { className: "hidden md:table-cell" },
            cell: ({ row }) => (
                <div className="text-slate-500 font-mono text-[10px] text-nowrap">
                    {formatDate(row.original.joinDate).toUpperCase()}
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            meta: { align: "center" },
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className="flex gap-2 items-center justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onQrClick(member.id, `${member.firstName} ${member.lastName || ""}`)}
                            className={cn(
                                "h-9 w-9 rounded-xl border border-white/5 bg-white/5 transition-all text-slate-400 hover:text-primary hover:border-primary/50",
                                !canScan && "opacity-20 grayscale"
                            )}
                        >
                            <QrCode className="w-4 h-4" />
                        </Button>

                        {showTrash && (
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={isProcessingRestore}
                                onClick={() => onRestoreClick(member.id)}
                                className="h-9 px-3 md:px-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all font-medium md:font-black text-[10px] tracking-tighter"
                            >
                                {isProcessingRestore ? <Loader2 className="w-3 h-3 md:mr-2 animate-spin" /> : null}
                                <span className="hidden md:inline">{isProcessingRestore ? "Restoring" : "Restore"}</span>
                                {!isProcessingRestore && <span className="md:hidden">Restore</span>}
                            </Button>
                        )}

                        {!showTrash && (
                            <Link href={`/members/${member.id}`} className="group">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 md:w-[110px] px-0 rounded-xl border-white/5 bg-white/5 text-white font-medium md:font-black text-[10px] tracking-tighter hover:bg-primary transition-all overflow-hidden relative"
                                >
                                    <div className="flex items-center justify-center w-full h-full relative">
                                        <Eye className="w-4 h-4 transition-all duration-500 md:group-hover:scale-125 md:group-hover:translate-x-[35px] relative z-10" />
                                        <span className="hidden md:block ml-2 transition-all duration-500 group-hover:opacity-0 group-hover:translate-x-10 whitespace-nowrap">
                                            View Profile
                                        </span>
                                    </div>
                                </Button>
                            </Link>
                        )}
                        {['owner', 'gym_owner', 'super_admin', 'manager'].includes(userRole) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteClick(member.id)}
                                className={cn(
                                    "h-9 w-9 rounded-xl border transition-all",
                                    showTrash
                                        ? "border-destructive bg-destructive/10 text-destructive hover:bg-destructive hover:text-white"
                                        : "border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white"
                                )}
                                title={showTrash ? "Permanently Delete" : "Move to Trash"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];
