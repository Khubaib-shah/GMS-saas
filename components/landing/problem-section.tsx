import { SectionHeading } from "./section-heading"
import { FileSpreadsheet, CreditCard, Users, Package } from "lucide-react"

const problems = [
  {
    icon: FileSpreadsheet,
    stat: "4+ hrs",
    statLabel: "wasted every week",
    title: "Members skip payments",
    description: "Without automated tracking, expired members keep training. You lose thousands every month and don't even notice.",
  },
  {
    icon: CreditCard,
    stat: "23%",
    statLabel: "revenue leaked",
    title: "Everything is manual",
    description: "Attendance in a register. Billing in Excel. Trainer schedules on WhatsApp. One mistake and your whole day falls apart.",
  },
  {
    icon: Users,
    stat: "60%",
    statLabel: "staff turnover",
    title: "No visibility into the business",
    description: "You can't see which plans sell best, when members drop off, or how much you actually made this month.",
  },
]

export function ProblemSection() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">The problem</div>
          <SectionHeading
            title="Running a gym without software is painful"
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] text-white/40 leading-relaxed">
            Most gym owners still use spreadsheets and WhatsApp groups. It costs them money every single day.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <div
              key={i}
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300"
            >
              {/* Stat */}
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-2xl font-bold text-red-400">{p.stat}</span>
                <span className="text-[11px] text-white/30 uppercase tracking-widest">{p.statLabel}</span>
              </div>

              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-red-500/[0.08] border border-red-500/[0.15] flex items-center justify-center mb-5">
                <p.icon className="w-4 h-4 text-red-400" />
              </div>

              <h3 className="text-[16px] font-semibold text-white mb-2 tracking-tight">{p.title}</h3>
              <p className="text-[13px] text-white/40 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
