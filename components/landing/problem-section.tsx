import { XCircle, FileSpreadsheet, Users, CreditCard } from "lucide-react"

export function ProblemSection() {
  const problems = [
    {
      icon: <FileSpreadsheet className="w-6 h-6" />,
      title: "Manual Attendance Tracking",
      description: "Losing track of who is actually showing up. Paper logs or clunky Excel sheets that take hours to reconcile.",
      stat: "4hrs+",
      statLabel: "wasted weekly"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Payment Confusion",
      description: "Chasing members for pending dues. Unclear revenue projections and manual receipt generation.",
      stat: "23%",
      statLabel: "revenue leaked"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Staff Mismanagement",
      description: "No clear visibility into trainer schedules or staff performance. Miscommunication leading to poor member experience.",
      stat: "60%",
      statLabel: "staff turnover"
    },
    {
      icon: <XCircle className="w-6 h-6" />,
      title: "No Centralized System",
      description: "Using 5 different apps to manage one gym. High software costs and zero integration between departments.",
      stat: "5+",
      statLabel: "apps juggled"
    }
  ]

  return (
    <section className="py-28 px-6 bg-slate-950 relative overflow-hidden">
      {/* Subtle red ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold mb-6 tracking-widest uppercase">
            The Problem
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Running a gym shouldn&apos;t feel <br className="hidden md:block" /> like a workout.
          </h2>
          <p className="text-lg text-slate-400">
            Most gym owners spend their days putting out fires instead of growing their business. Sound familiar?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map((problem, i) => (
            <div key={i} className="group relative bg-slate-900/60 border border-white/5 rounded-2xl p-7 hover:border-red-500/20 transition-all duration-500 overflow-hidden">
              {/* Hover glow */}
              <div className="absolute inset-0 bg-red-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10">

                <div className="flex items-center justify-between gap-4" >

                  {/* Stat */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-red-400">{problem.stat}</span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{problem.statLabel}</span>
                  </div>
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6 group-hover:bg-red-500/20 transition-colors duration-500">
                    {problem.icon}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-3">{problem.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{problem.description}</p>
              </div>

              {/* Corner decorator */}
              <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-red-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
