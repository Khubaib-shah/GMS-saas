import { Users2, ShieldCheck, QrCode, CreditCard, LineChart, Network } from "lucide-react"
import { cn } from "@/lib/utils"

export function CoreFeatures() {
  const features = [
    {
      title: "Member Management",
      description: "Comprehensive profiles with attendance history, payment status, and workout logs.",
      benefit: "Never lose track of a member again.",
      icon: <Users2 className="w-6 h-6" />,
      color: "text-blue-400",
      bgClass: "bg-blue-400/10 border-blue-400/20"
    },
    {
      title: "Staff & Trainer Control",
      description: "Assign roles, track hours, and manage trainer-client assignments effortlessly.",
      benefit: "Empower your team with full accountability.",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "text-emerald-400",
      bgClass: "bg-emerald-400/10 border-emerald-400/20"
    },
    {
      title: "Smart Attendance System",
      description: "Lightning-fast QR check-ins and smart alerts for expiring memberships at the front desk.",
      benefit: "Eliminate bottleneck at the entrance.",
      icon: <QrCode className="w-6 h-6" />,
      color: "text-primary",
      bgClass: "bg-primary/10 border-primary/20"
    },
    {
      title: "Payments & Subscriptions",
      description: "Automated tracking of upcoming dues, partial payments, and customized billing cycles.",
      benefit: "Maximize your cash flow automatically.",
      icon: <CreditCard className="w-6 h-6" />,
      color: "text-violet-400",
      bgClass: "bg-violet-400/10 border-violet-400/20"
    },
    {
      title: "Financial Dashboard",
      description: "Real-time insights into revenue, active members, churn rate, and projected growth.",
      benefit: "Make data-driven business decisions.",
      icon: <LineChart className="w-6 h-6" />,
      color: "text-orange-400",
      bgClass: "bg-orange-400/10 border-orange-400/20"
    },
    {
      title: "Multi-Branch Management",
      description: "Oversee multiple locations from a single admin panel with unified reporting.",
      benefit: "Scale your fitness empire seamlessly.",
      icon: <Network className="w-6 h-6" />,
      color: "text-cyan-400",
      bgClass: "bg-cyan-400/10 border-cyan-400/20"
    }
  ]

  return (
    <section id="features" className="py-32 px-6 bg-slate-950/80 relative">
      <div className="max-w-7xl mx-auto">
        <div className="mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Powerful features. <br /> Built for growth.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl">
            We've built every tool you need to manage your gym, without the feature bloat. Everything here is designed to save time and increase your bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {features.map((feature, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-start hover:-translate-y-1 duration-300">
              <div className={cn("w-14 h-[38px] rounded-xl flex items-center justify-center mb-6 border", feature.bgClass, feature.color)}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed mb-6 flex-1">
                {feature.description}
              </p>
              <div className="pt-4 border-t border-white/10 w-full mt-auto">
                <p className="text-sm font-medium text-white/80">
                  <span className="text-primary mr-2">✓</span> {feature.benefit}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
