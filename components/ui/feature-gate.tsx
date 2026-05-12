"use client"

import { useAppStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"
import { Button } from "./button"

interface FeatureGateProps {
  children: React.ReactNode
  feature: string | string[]
  fallback?: React.ReactNode
  redirect?: boolean
}

export function FeatureGate({ children, feature, fallback, redirect = true }: FeatureGateProps) {
  const router = useRouter()
  const enabledFeatures = useAppStore((state) => state.gymProfile.enabledFeatures) || []
  const [isLoaded, setIsLoaded] = useState(false)
  const gymId = useAppStore((state) => state.gymProfile._id)

  useEffect(() => {
    if (gymId) {
      setIsLoaded(true)
    }
  }, [gymId])

  const features = Array.isArray(feature) ? feature : [feature]
  const hasAccess = features.some(f => enabledFeatures.includes(f))

  useEffect(() => {
    if (isLoaded && !hasAccess && redirect) {
      router.push("/dashboard")
    }
  }, [isLoaded, hasAccess, redirect, router])

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Verifying access...</p>
      </div>
    )
  }

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20 border border-rose-500/20">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase text-white">Access Restricted</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] max-w-[300px] leading-relaxed">
            This module is currently disabled for your gym. Please contact support or your administrator to enable this feature.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard")}
          className="h-12 px-8 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl"
        >
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
