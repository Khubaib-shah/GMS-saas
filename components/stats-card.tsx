import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ title, value, icon, trend, className }: StatsCardProps) {
  return (
    <Card className={cn("p-6 flex flex-col justify-between shadow-sm border-border/60", className)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground tracking-tight">{title}</span>
        <div className="p-2 rounded-full bg-secondary text-primary">
            {icon}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-end">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words truncate" title={String(value)}>
          {value}
        </h3>
        {trend && (
            <div className="flex items-center gap-1 mt-1 text-xs font-medium">
                <span className={cn(trend.isPositive ? "text-green-600" : "text-red-600")}>
                {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground">from last month</span>
            </div>
        )}
      </div>
    </Card>
  )
}
