import React from "react"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  title: string
  highlight?: string
  subtitle?: string
  description?: string
  descriptionIconColor?: "primary" | "emerald" | "amber" | "red"
  className?: string
  children?: React.ReactNode
}

export function DashboardHeader({
  title,
  highlight,
  subtitle,
  description,
  descriptionIconColor = "primary",
  className,
  children,
}: DashboardHeaderProps) {
  const iconColorMap = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  }

  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between mb-12 relative gap-6", className)}>
      <div className="relative">
        <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary neon-glow"></div>
        <div>
          {subtitle && (
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic whitespace-nowrap">
                {subtitle}
              </span>
              <div className="h-px flex-1 md:w-24 bg-white/5"></div>
            </div>
          )}
          {!subtitle && (
            <div className="flex items-center gap-4 mb-2">
              <div className="h-px w-24 bg-white/5"></div>
            </div>
          )}
          <h1 className="text-5xl md:text-6xl font-black text-foreground italic tracking-tighter uppercase leading-none">
            {title} {highlight && <span className="text-primary neon-text">{highlight}</span>}
          </h1>
          {description && (
            <div className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", iconColorMap[descriptionIconColor])}></div>
              {description}
            </div>
          )}
        </div>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  )
}
