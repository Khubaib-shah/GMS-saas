"use client";

import { CheckCircle2, AlertCircle, Clock, TrendingUp, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/file-utils";

interface AttendanceResultProps {
    data: {
        message: string;
        member: {
            fullName: string;
            activeSubscription?: {
                planName: string;
                endDate: string;
                status: string;
            };
            attendanceStreak: number;
        };
    };
    isCheckout?: boolean;
    onClose: () => void;
}

export function AttendanceResult({ data, isCheckout, onClose }: AttendanceResultProps) {
    const { member } = data;
    const sub = member.activeSubscription;
    
    // Calculate if expiring soon (less than 3 days)
    const daysLeft = sub ? Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const isExpiringSoon = daysLeft >= 0 && daysLeft <= 3;

    return (
        <div className={cn(
            "animate-in zoom-in-95 fade-in duration-300 p-6 rounded-2xl border-2 shadow-2xl space-y-4",
            isCheckout ? "bg-blue-500/5 border-blue-500/20" : "bg-emerald-500/5 border-emerald-500/20",
            isExpiringSoon && "border-amber-500/40 bg-amber-500/5"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        isCheckout ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"
                    )}>
                        {isCheckout ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">{isCheckout ? "Check-out" : "Check-in"} Successful</h4>
                        <p className="text-xl font-black tracking-tighter uppercase text-foreground">{member.fullName}</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-foreground transition-colors"
                >
                    <AlertCircle className="w-5 h-5 opacity-20" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Streak</span>
                    </div>
                    <p className="text-sm font-black italic">{member.attendanceStreak} Days</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Plan Ends</span>
                    </div>
                    <p className={cn(
                        "text-sm font-black italic",
                        isExpiringSoon ? "text-amber-500" : "text-foreground"
                    )}>
                        {sub ? formatDate(sub.endDate) : "No Active Sub"}
                    </p>
                </div>
            </div>

            {isExpiringSoon && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-wider leading-relaxed">
                        Subscription expires in {daysLeft} days. Remind member to renew!
                    </p>
                </div>
            )}

            {!sub && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-[10px] font-black uppercase text-red-500 tracking-wider leading-relaxed">
                        No active subscription found. Check billing!
                    </p>
                </div>
            )}
        </div>
    );
}
