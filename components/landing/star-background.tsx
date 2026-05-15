"use client"

import { cn } from "@/lib/utils"
import { useMemo } from "react"

interface StarBackgroundProps {
  className?: string
  includeGradient?: boolean
}

/**
 * Generates a string of box-shadows for stars
 * @param count Number of stars to generate
 */
function generateStars(count: number) {
  let shadows = ""
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 2000)
    const y = Math.floor(Math.random() * 2000)
    shadows += `${x}px ${y}px #FFF${i !== count - 1 ? ", " : ""}`
  }
  return shadows
}

export function StarBackground({ className, includeGradient = false }: StarBackgroundProps) {
  const stars1 = useMemo(() => generateStars(700), [])
  const stars2 = useMemo(() => generateStars(200), [])
  const stars3 = useMemo(() => generateStars(100), [])

  return (
    <div className={cn(
      "absolute inset-0 -z-10 overflow-hidden pointer-events-none",
      includeGradient && "bg-[radial-gradient(ellipse_at_bottom,_#1B2735_0%,_#090A0F_100%)]",
      className
    )}>
      <div id="stars" style={{ boxShadow: stars1 }} />
      <div id="stars2" style={{ boxShadow: stars2 }} />
      <div id="stars3" style={{ boxShadow: stars3 }} />
    </div>
  )
}
