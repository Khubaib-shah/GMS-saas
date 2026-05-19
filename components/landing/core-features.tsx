import { SectionHeading } from "./section-heading"
import { Users2, CreditCard, QrCode, ShoppingBag, Dumbbell, BarChart2 } from "lucide-react"
import { StarBackground } from "./star-background"

const features = [
  {
    icon: Users2,
    title: "Member Management",
    description: "Full profiles with photos, plans, trainers, and QR codes. Search, filter, and export in seconds.",
  },
  {
    icon: CreditCard,
    title: "Billing & Payments",
    description: "Track every rupee. Cash, card, or bank transfer. Auto-generate receipts and see revenue breakdowns.",
  },
  {
    icon: QrCode,
    title: "QR Attendance",
    description: "Scan and verify in under a second. Block expired members automatically. View attendance trends.",
  },
  {
    icon: ShoppingBag,
    title: "Point of Sale",
    description: "Sell supplements, drinks, and gear from the front desk. Track inventory and log all sales separately.",
  },
  {
    icon: Dumbbell,
    title: "Workout Tracking",
    description: "Trainers build plans. Members log sets and reps on their phones. Track progress over months.",
  },
  {
    icon: BarChart2,
    title: "Reports & Analytics",
    description: "Revenue trends, member growth, attendance peaks, and churn rates. Export PDF reports anytime.",
  },
]

export function CoreFeatures() {
  return (
    <section id="features" className="py-16 md:py-32 px-4 md:px-6 relative overflow-hidden">
      <StarBackground /> 
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-xl mb-10 md:mb-16">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-4">Features</div>
          <SectionHeading
            title="Everything"
            highlight="your gym needs"
            subtitle="Nothing it doesn't"
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] md:text-[17px] text-white/70 leading-relaxed max-w-xl">
            Six powerful modules working together so you can focus on your members, not your paperwork.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-black p-6 md:p-8 flex flex-col gap-4 hover:bg-white/[0.02] transition-colors duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-[#c6ff00]/[0.08] border border-[#c6ff00]/[0.15] flex items-center justify-center">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2 tracking-tight">{f.title}</h3>
                <p className="text-[13px] text-white/60 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}