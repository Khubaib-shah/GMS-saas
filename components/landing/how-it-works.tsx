import { Building, Users, Activity, TrendingUp } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Add your gym & staff",
      description: "Setup your branch, define roles, and give your trainers and receptionists dedicated access.",
      icon: <Building className="w-8 h-8 text-primary" />
    },
    {
      number: "02",
      title: "Manage members & subs",
      description: "Import existing members or add new ones. Assign dynamic subscription plans with automated billing.",
      icon: <Users className="w-8 h-8 text-primary" />
    },
    {
      number: "03",
      title: "Track attendance",
      description: "Use our smart QR or manual entry to log member visits, ensuring real-time capacity and activity data.",
      icon: <Activity className="w-8 h-8 text-primary" />
    },
    {
      number: "04",
      title: "Monitor revenue",
      description: "View real-time dashboards detailing outstanding dues, collected payments, and overall growth metrics.",
      icon: <TrendingUp className="w-8 h-8 text-primary" />
    }
  ]

  return (
    <section id="how-it-works" className="py-32 px-6 bg-slate-950 relative border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Four steps to automation.
          </h2>
          <p className="text-lg text-slate-400">
            We designed GymFlow to be intuitive from day one. You can be up and running with your entire business configured in less than an hour.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden lg:block absolute top-[4.5rem] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl font-black text-slate-600 mb-8 mx-auto relative z-10 group-hover:border-primary/50 group-hover:scale-110 transition-all duration-300">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {step.icon}
              </div>
              <div className="text-center">
                <div className="text-primary text-sm font-black mb-2 tracking-widest">STEP {step.number}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
