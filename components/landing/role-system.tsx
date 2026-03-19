import { Shield, Key, Dumbbell, Receipt, User, Calculator } from "lucide-react"

export function RoleSystem() {
  const roles = [
    {
      title: "Owner",
      icon: <Shield className="w-5 h-5" />,
      desc: "Full analytics, multi-branch control, and financial oversight. See the big picture.",
      borderColor: "border-emerald-500",
      bgGlow: "bg-emerald-500/10"
    },
    {
      title: "Manager",
      icon: <Key className="w-5 h-5" />,
      desc: "Daily operations, staff management, and member conflict resolution.",
      borderColor: "border-blue-500",
      bgGlow: "bg-blue-500/10"
    },
    {
      title: "Trainer",
      icon: <Dumbbell className="w-5 h-5" />,
      desc: "Client progress tracking, schedule management, and workout plan assignments.",
      borderColor: "border-orange-500",
      bgGlow: "bg-orange-500/10"
    },
    {
      title: "Receptionist",
      icon: <Receipt className="w-5 h-5" />,
      desc: "Member onboarding, quick check-ins, and daily payment collections.",
      borderColor: "border-purple-500",
      bgGlow: "bg-purple-500/10"
    },
    {
      title: "Accountant",
      icon: <Calculator className="w-5 h-5" />,
      desc: "Dedicated financial access for bookkeepers to handle payroll, expenses, and tax reporting.",
      borderColor: "border-rose-500",
      bgGlow: "bg-rose-500/10"
    },
    {
      title: "Member",
      icon: <User className="w-5 h-5" />,
      desc: "Personal dashboard for attendance, remaining days, and billing history.",
      borderColor: "border-slate-400",
      bgGlow: "bg-slate-400/10"
    }
  ]

  return (
    <section className="py-32 px-6 bg-slate-950 border-t border-white/5 relative overflow-hidden">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            A workspace for everyone.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            GymFlow isn't just an admin tool. It provides dedicated, secure portals for every role in your business. Control who sees what with granular permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-6 bg-slate-900 border-t-[3px] border-x border-b border-x-white/5 border-b-white/5 rounded-b-xl rounded-t-sm hover:-translate-y-2 transition-transform duration-300 ${role.borderColor}`}
            >
              <div className={`absolute top-0 left-0 w-full h-24 ${role.bgGlow} filter blur-3xl opacity-50`}></div>
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white border border-white/10 shrink-0">
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{role.title}</h3>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed relative z-10 flex-1">
                {role.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
