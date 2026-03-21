"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function PreLoader() {
  const [loading, setLoading] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)

  useEffect(() => {
    const handleLoad = () => {
      // Small delay for better UX and to ensure everything is settled
      const timer = setTimeout(() => {
        setLoading(false)
        // Remove from DOM after the fade-out transition
        const removeTimer = setTimeout(() => setShouldRender(false), 800)
        return () => clearTimeout(removeTimer)
      }, 1200)
      return () => clearTimeout(timer)
    }

    if (document.readyState === "complete") {
      handleLoad()
    } else {
      window.addEventListener("load", handleLoad)
      return () => window.removeEventListener("load", handleLoad)
    }
  }, [])

  if (!shouldRender) return null

  return (
    <div
      className={cn(
        "fixed inset-0 z-10000 flex flex-col items-center justify-center bg-[#020617] transition-all duration-700 ease-in-out",
        loading ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
      )}
    >
      <div className="relative flex flex-col items-center gap-12">
        {/* Animated Background Atmosphere */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] animate-pulse"></div>
            <div className="w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] animate-pulse-glow"></div>
        </div>

        {/* Orbiting Elements */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
            <div className="w-64 h-64 rounded-full border border-primary/10 animate-orbit-1"></div>
            <div className="w-80 h-80 rounded-full border border-blue-500/5 animate-orbit-2"></div>
        </div>

        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-6">
            <div className="relative group">
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white flex items-center gap-1 select-none">
                    GYM<span className="text-primary drop-shadow-[0_0_20px_rgba(190,255,0,0.6)]">FLOW</span>
                </h1>
                {/* Underline Glow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-linear-to-r from-transparent via-primary/50 to-transparent"></div>
            </div>

            {/* Premium Loading Bar */}
            <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-primary/10"></div>
                <div className="absolute inset-y-0 left-0 bg-primary w-2/3 animate-light-sweep shadow-[0_0_15px_rgba(190,255,0,0.8)]"></div>
            </div>
        </div>

        {/* Status indicator */}
        <div className="flex flex-col items-center gap-3">
            <div className="text-slate-500 text-[10px] font-bold tracking-[0.4em] uppercase">
                Synchronizing Workspace
            </div>
            <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                    <div 
                        key={i} 
                        className="w-1 h-1 rounded-full bg-primary/50 animate-bounce" 
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}
