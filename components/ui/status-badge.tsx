"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle, PauseCircle, Clock } from "lucide-react"

export type StatusType = "active" | "expired" | "expiring" | "paused" | "grace" | "deleted"

interface StatusBadgeProps {
  status: StatusType
  className?: string
  variant?: "default" | "icon"
  children?: React.ReactNode
}

export function StatusBadge({ status, className, variant = "default", children }: StatusBadgeProps) {
  const config = {
    active: {
      label: "Active",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    expired: {
      label: "Expired",
      icon: XCircle,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    expiring: {
      label: "Expiring",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    paused: {
      label: "Paused",
      icon: PauseCircle,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    grace: {
      label: "Grace",
      icon: Clock,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
    deleted: {
      label: "Deleted",
      icon: XCircle,
      color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    }
  }

  const { label, icon: Icon, color } = config[status] || config.expired

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center justify-center group/status relative", className)}>
        <Icon className={cn("w-3 h-3 md:w-5 md:h-5", color.split(" ")[0])} />
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 shadow-xl z-50">
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
      color,
      className
    )}>
      <Icon className="w-3.5 h-3.5 md:w-3 md:h-3" />
      <span className="hidden md:inline">{children || label}</span>
    </div>
  )
}
