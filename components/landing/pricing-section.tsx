import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function PricingSection() {
  const plans = [
    {
      name: "Basic",
      desc: "For independent studio owners.",
      price: "3,000",
      features: [
        "Up to 30 Members",
        "Manual Attendance",
        "Basic Analytics",
        "Standard Reports"
      ]
    },
    {
      name: "Professional",
      desc: "Advanced management for growing gyms.",
      price: "5,000",
      features: [
        "Up to 2 Branches",
        "Up to 100 Members",
        "QR Attendance Check-in",
        "Detailed Reports",
        "Trainer Assignments",
        "Settings & Customization",
        "Priority Staff Support"
      ],
      highlight: true
    },
    {
      name: "Enterprise",
      desc: "Complete command for multi-branch chains.",
      price: "8,000",
      features: [
        "Everything in Professional",
        "Unlimited Branches",
        "Unlimited Members",
        "Advanced Financial Analytics",
        "Dedicated Account Manager",
        "Custom Deployments",
      ]
    }
  ]

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
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col p-8 rounded-3xl transition-transform duration-300 ${plan.highlight
                ? "bg-slate-900 border-2 border-primary shadow-[0_0_40px_rgba(190,255,0,0.15)] transform scale-100 md:scale-105 z-10"
                : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-black font-bold uppercase tracking-wider text-xs px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-8">
                <h3 className={`text-2xl font-bold mb-2 ${plan.highlight ? "text-primary" : "text-white"}`}>{plan.name}</h3>
                <p className="text-slate-400 text-sm h-10">{plan.desc}</p>
                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-bold text-white">₨ {plan.price}</span>
                  <span className="text-slate-500 font-medium mb-1">/ mo</span>
                </div>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${plan.highlight ? "text-primary" : "text-slate-500"}`} />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Link href={`/signup?plan=${encodeURIComponent(plan.name)}`}>
                <Button
                  className={`w-full py-6 text-base font-semibold rounded-xl transition-all ${plan.highlight
                    ? "bg-primary text-black hover:bg-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                >
                  Get Started
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
