"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PlatformPlan {
  id: string
  name: string
  slug: string
  description: string
  monthlyPricePKR: number
  branchLimit: number
  maxStaffAccounts: number
  featureFlags: string[]
}

export function PricingSection() {
  const [plans, setPlans] = useState<PlatformPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/platform/plans")
        const data = await res.json()
        if (data.plans) {
          setPlans(data.plans)
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  const getFeatures = (plan: PlatformPlan) => {
    const features = [
      `${plan.branchLimit === 1 ? "1 Branch" : `Up to ${plan.branchLimit} Branches`}`,
      `${plan.maxStaffAccounts} Staff Accounts`,
    ]

    if (plan.featureFlags.includes("members")) features.push("Member Management")
    if (plan.featureFlags.includes("attendance")) features.push("QR/Manual Attendance")
    if (plan.featureFlags.includes("payments")) features.push("Financial Reports")
    if (plan.featureFlags.includes("trainersModule")) features.push("Trainer Management")
    if (plan.featureFlags.includes("workoutPlanner")) features.push("Workout Planner")
    
    return features
  }

  if (loading) {
    return (
      <section id="pricing" className="py-32 px-6 bg-slate-950 border-t border-white/5 relative">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-slate-400">Loading our latest plans...</p>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-32 px-6 bg-slate-950 border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Transparent pricing for <br /> every stage of growth.
          </h2>
          <p className="text-lg text-slate-400">
            No hidden fees. Pay for the capacity you need, with all core features included.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isProfessional = plan.slug === "professional" || plan.name.toLowerCase() === "professional"
            const features = getFeatures(plan)

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 rounded-3xl transition-transform duration-300 ${isProfessional
                  ? "bg-slate-900 border-2 border-primary shadow-[0_0_40px_rgba(190,255,0,0.15)] transform scale-100 md:scale-105 z-10"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
              >
                {isProfessional && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold uppercase tracking-wider text-xs px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${isProfessional ? "text-primary" : "text-white"}`}>{plan.name}</h3>
                  <p className="text-slate-400 text-sm h-10">{plan.description || `For ${plan.name.toLowerCase()} owners.`}</p>
                  <div className="mt-6 flex items-end gap-2">
                    <span className="text-4xl font-bold text-white">₨ {plan.monthlyPricePKR.toLocaleString()}</span>
                    <span className="text-slate-500 font-medium mb-1">/ mo</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {features.map((feature, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${isProfessional ? "text-primary" : "text-slate-500"}`} />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href={`/signup?plan=${encodeURIComponent(plan.slug)}`}>
                  <Button
                    className={`w-full py-6 text-base font-semibold rounded-xl transition-all ${isProfessional
                      ? "bg-primary text-black hover:bg-white"
                      : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
