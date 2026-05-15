import { SectionHeading } from "./section-heading"
import { Crown, ClipboardList, Monitor, Dumbbell, User } from "lucide-react"

const roles = [
  {
    icon: Crown,
    title: "Owner",
    description: "Full control. Revenue reports, staff management, settings, and billing — all in one view.",
  },
  {
    icon: ClipboardList,
    title: "Manager",
    description: "Day-to-day operations. Add members, process payments, and manage subscriptions.",
  },
  {
    icon: Monitor,
    title: "Receptionist",
    description: "Front desk focus. Scan QR codes, sell products, and check member status instantly.",
  },
  {
    icon: Dumbbell,
    title: "Trainer",
    description: "Build workout plans, manage bookings, and track client progress over time.",
  },
  {
    icon: User,
    title: "Member",
    description: "Personal portal. View your plan, log workouts, and check attendance history.",
  },
]

export function RoleSystem() {
  return (
    <section className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">Built for every role</div>
          <SectionHeading
            title="One platform. Five different experiences."
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] text-white/40 leading-relaxed">
            Every person in your gym sees exactly what they need. Nothing more, nothing less.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roles.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col gap-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#c6ff00]/[0.06] border border-[#c6ff00]/[0.12] flex items-center justify-center group-hover:bg-[#c6ff00]/[0.12] transition-colors">
                <r.icon className="w-4 h-4 text-[#c6ff00]" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white mb-1.5 tracking-tight">{r.title}</h3>
                <p className="text-[12px] text-white/40 leading-relaxed">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
