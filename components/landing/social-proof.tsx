export function SocialProof() {
  const stats = [
    { value: "12,400+", label: "Members managed" },
    { value: "86,000+", label: "Check-ins recorded" },
    { value: "Rs 4.2M+", label: "Revenue processed" },
    { value: "99.9%", label: "Uptime guarantee" },
  ]

  return (
    <section className="border-y border-white/[0.06] py-16 px-6 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-xl overflow-hidden border border-white/[0.06]">
          {stats.map((s, i) => (
            <div key={i} className="bg-black px-8 py-8 flex flex-col gap-1">
              <div className="text-3xl font-bold tracking-tight text-white">{s.value}</div>
              <div className="text-[12px] text-white/40 uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
