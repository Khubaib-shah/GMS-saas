const steps = [
  {
    n: "01",
    title: "Create your gym",
    description: "Sign up, enter your gym name and location. Your dashboard is ready in 30 seconds.",
  },
  {
    n: "02",
    title: "Add your members",
    description: "Import existing members or add them one by one. Each member gets a unique QR code automatically.",
  },
  {
    n: "03",
    title: "Set up your plans",
    description: "Create monthly, quarterly, or yearly plans with custom pricing. Assign plans with one click.",
  },
  {
    n: "04",
    title: "Go live",
    description: "Start scanning QR codes. Track payments. Sell products. Watch your reports fill up in real time.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-20">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">How it works</div>
          <h2 className="text-3xl md:text-[44px] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-4">
            Up and running in under 10 minutes
          </h2>
          <p className="text-[15px] text-white/40 leading-relaxed">
            No installation. No training needed. Just sign up and start managing.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-5 left-[12.5%] right-[12.5%] h-px bg-white/[0.06]" />

          {steps.map((s, i) => (
            <div key={i} className="flex flex-col gap-5">
              {/* Number */}
              <div className="relative w-10 h-10 rounded-full border border-white/[0.12] bg-white/[0.03] flex items-center justify-center z-10">
                <span className="text-[12px] font-bold text-[#c6ff00]">{s.n}</span>
              </div>

              <div>
                <h3 className="text-[15px] font-semibold text-white mb-2 tracking-tight">{s.title}</h3>
                <p className="text-[13px] text-white/40 leading-relaxed">{s.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
