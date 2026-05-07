"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "./button"

interface PremiumButtonProps extends ButtonProps {
  highlight?: boolean
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, highlight, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        className={cn(
          "h-7 md:h-9 px-4 rounded-xl border transition-all font-medium md:font-black tracking-tighter uppercase text-[11px] gap-2",
          highlight 
            ? "bg-primary text-black border-primary hover:bg-white hover:border-white shadow-[0_0_20px_rgba(var(--primary),0.2)]" 
            : "bg-white/5 border-white/10 text-slate-400 hover:text-primary hover:border-primary/50",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
PremiumButton.displayName = "PremiumButton"

export { PremiumButton }
