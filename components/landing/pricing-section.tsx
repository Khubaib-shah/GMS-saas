"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
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
  isPopular?: boolean
  sortOrder?: number
}

const FALLBACK_PLANS = [
  {
    id: "starter", slug: "starter", name: "Starter", monthlyPricePKR: 3000, isPopular: false, sortOrder: 0,
    description: "For small gyms just getting started.",
    branchLimit: 1, maxStaffAccounts: 3,
    featureFlags: ["members", "manualAttendance", "payments"],
  },
  {
    id: "professional", slug: "professional", name: "Professional", monthlyPricePKR: 6000, isPopular: true, sortOrder: 1,
    description: "For growing gyms that need more power.",
    branchLimit: 3, maxStaffAccounts: 10,
    featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics"],
  },
  {
    id: "enterprise", slug: "enterprise", name: "Enterprise", monthlyPricePKR: 10000, isPopular: false, sortOrder: 2,
    description: "For multi-branch chains and franchises.",
    branchLimit: 10, maxStaffAccounts: 50,
    featureFlags: ["members", "manualAttendance", "qrAttendance", "payments", "subscriptions", "trainersModule", "analytics", "workoutPlanner", "auditLogs"],
  },
]

function getFeatures(plan: PlatformPlan): string[] {
  const f: string[] = []
  if (plan.branchLimit === 1) f.push("1 branch")
  else if (plan.branchLimit >= 10) f.push("Unlimited branches")
  else f.push(`Up to ${plan.branchLimit} branches`)

  if (plan.maxStaffAccounts <= 3) f.push("Up to 3 staff accounts")
  else if (plan.maxStaffAccounts >= 50) f.push("Unlimited staff accounts")
  else f.push(`Up to ${plan.maxStaffAccounts} staff accounts`)

  if (plan.featureFlags.includes("members")) f.push("Member management")
  if (plan.featureFlags.includes("manualAttendance")) f.push("Manual attendance")
  if (plan.featureFlags.includes("qrAttendance")) f.push("QR code attendance")
  if (plan.featureFlags.includes("payments")) f.push("Billing & payments")
  if (plan.featureFlags.includes("trainersModule")) f.push("Trainer management")
  if (plan.featureFlags.includes("analytics")) f.push("Advanced analytics")
  if (plan.featureFlags.includes("workoutPlanner")) f.push("Workout planner")
  if (plan.featureFlags.includes("auditLogs")) f.push("Security audit logs")
  return f
}

export function PricingSection() {
  const [plans, setPlans] = useState<PlatformPlan[]>(FALLBACK_PLANS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/platform/plans")
        const data = await res.json()
        if (data.plans && data.plans.length > 0) {
          setPlans([...data.plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))
        }
      } catch {
        // fallback already set
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [])

  return (
    <section id="pricing" className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">Pricing</div>
          <h2 className="text-3xl md:text-[44px] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-4">
            Simple pricing. No hidden fees.
          </h2>
          <p className="text-[15px] text-white/40 leading-relaxed">
            Start small. Upgrade when you grow. Cancel anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 text-[#c6ff00] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const features = getFeatures(plan)
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl p-8 flex flex-col gap-8 ${plan.isPopular
                    ? "border border-[#c6ff00]/40 bg-[#c6ff00]/[0.03]"
                    : "border border-white/[0.06] bg-white/[0.02]"
                    }`}
                >
                  {/* Popular badge */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#c6ff00] text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Most popular
                    </div>
                  )}

                  <div>
                    <div className="text-[13px] font-semibold text-white mb-1">{plan.name}</div>
                    <div className="text-[12px] text-white/30 mb-6">{plan.description}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-white">
                        Rs {plan.monthlyPricePKR.toLocaleString()}
                      </span>
                      <span className="text-[13px] text-white/30">/month</span>
                    </div>
                  </div>

                  <ul className="flex flex-col gap-3 flex-1">
                    {features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-[13px] text-white/50">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${plan.isPopular ? "text-[#c6ff00]" : "text-white/30"}`} strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/signup?plan=${encodeURIComponent(plan.slug)}`} className="w-full">
                    {plan.isPopular ? (
                      <button className="btn-nav-secondary w-full">
                        <span>Get started</span>
                      </button>
                    ) : (
                      <button className="btn-hero-reveal w-full">
                        <div className="hero-text">
                          {"Get started".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                        </div>
                        <div className="hero-clone">
                          {"Get started".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                        </div>
                      </button>
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
