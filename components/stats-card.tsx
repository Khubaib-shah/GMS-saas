import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  periodLabel?: string
  className?: string
  isLoading?: boolean
}

export function StatsCard({ title, value, icon, trend, className, isLoading, periodLabel = "previous period" }: StatsCardProps) {
  return (
    <div className={cn("glass-premium p-6 flex flex-col justify-between border-border bg-card dark:bg-slate-950/40", className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">{title}</span>
        <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
            {icon}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-end">
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter text-foreground uppercase truncate" title={String(value)}>
            {value}
          </h3>
        )}
        {isLoading ? (
          <Skeleton className="h-3 w-32 mt-2" />
        ) : trend && (
            <div className="flex items-center gap-1 mt-2 text-[9px] font-black italic tracking-widest uppercase">
                <span className={cn(trend.isPositive ? "text-primary" : "text-red-500")}>
                {trend.isPositive ? "↑" : "↓"} {trend.value}%
                </span>
                <span className="text-slate-500">from {periodLabel}</span>
            </div>
        )}
      </div>
    </div>
  )
}
