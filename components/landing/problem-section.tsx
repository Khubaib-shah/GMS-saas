import { SectionHeading } from "./section-heading";
import { FileSpreadsheet, CreditCard, Users, Package } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    stat: "4+ hrs",
    statLabel: "wasted every week",
    title: "Members skip payments",
    description:
      "Without automated tracking, expired members keep training. You lose thousands every month and don't even notice.",
  },
  {
    icon: CreditCard,
    stat: "23%",
    statLabel: "revenue leaked",
    title: "Everything is manual",
    description:
      "Attendance in a register. Billing in Excel. Trainer schedules on WhatsApp. One mistake and your whole day falls apart.",
  },
  {
    icon: Users,
    stat: "60%",
    statLabel: "staff turnover",
    title: "No visibility into the business",
    description:
      "You can't see which plans sell best, when members drop off, or how much you actually made this month.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-32 px-6 relative">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-4">
            The problem
          </div>
          <SectionHeading
            title="Running a gym"
            highlight="without software"
            subtitle="\nis painful"
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] text-white/80 leading-relaxed">
            Most gym owners still use spreadsheets and WhatsApp groups. It costs
            them money every single day.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((p, i) => (
            <div key={i} className="premium-stat-outer">
              <div className="stat-dot" />
              <div className="premium-stat-card p-8">
                <div className="stat-ray !right-0" />
                <div className="stat-line stat-topl" />
                <div className="stat-line stat-leftl" />
                <div className="stat-line stat-bottoml" />
                <div className="stat-line stat-rightl" />
                {/* Stat */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-red-400">
                      {p.stat}
                    </span>
                    <span className="text-[11px] text-white/30 uppercase tracking-widest">
                      {p.statLabel}
                    </span>
                  </div>
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-red-500/[0.08] border border-red-500/[0.15] flex items-center justify-center">
                    <p.icon className="w-4 h-4 text-red-400" />
                  </div>
                </div>
                <h3 className="text-[16px] font-semibold text-white mb-2 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-[13px] text-white/80 leading-relaxed">
                  {p.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
