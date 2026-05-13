import { Check } from "lucide-react"

const checks = [
  "Verify membership in under 1 second",
  "Automatically block expired members",
  "See peak hours and attendance trends",
  "Prevent QR sharing with daily limits",
]

// Static QR data modules — avoids Math.sin() map (not needed in Server Component)
const dataModules = [
  { x: 75, y: 140 }, { x: 90, y: 130 }, { x: 105, y: 145 }, { x: 120, y: 135 },
  { x: 140, y: 75 }, { x: 155, y: 90 }, { x: 140, y: 105 }, { x: 155, y: 120 },
  { x: 75, y: 110 }, { x: 90, y: 120 }, { x: 110, y: 110 }, { x: 125, y: 125 },
]

export function SolutionSection() {
  return (
    <section id="solution" className="py-32 px-6 border-t border-white/[0.06]">
      {/*
        Keyframe defined in a plain <style> tag — no styled-jsx,
        no "use client" required. This is valid in Server Components.
      */}
      <style>{`
        @keyframes qr-scan { 0%,100%{top:20%} 50%{top:78%} }
        .qr-scan-line { animation: qr-scan 2.5s ease-in-out infinite; }
      `}</style>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">The solution</div>
          <h2 className="text-3xl md:text-[44px] font-bold tracking-[-0.03em] text-white leading-[1.1] mb-5">
            Know exactly who walks in — instantly
          </h2>
          <p className="text-[15px] text-white/40 leading-relaxed mb-8">
            Every member gets a unique QR code. Your receptionist scans it. The system instantly checks their subscription and logs attendance. No guessing. No arguments.
          </p>
          <ul className="flex flex-col gap-3">
            {checks.map((c, i) => (
              <li key={i} className="flex items-center gap-3 text-[14px] text-white/60">
                <div className="w-5 h-5 rounded-full border border-[#c6ff00]/30 bg-[#c6ff00]/[0.08] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-[#c6ff00]" strokeWidth={2.5} />
                </div>
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: QR visual */}
        <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] aspect-square flex items-center justify-center overflow-hidden">
          {/* Animated scan line — uses .qr-scan-line class defined above */}
          <div
            className="qr-scan-line absolute left-[15%] right-[15%] h-[1px] bg-[#c6ff00] z-10"
            style={{ boxShadow: "0 0 12px #c6ff00, 0 0 24px #c6ff00aa" }}
          />

          {/* QR Code SVG */}
          <svg viewBox="0 0 200 200" className="w-48 h-48 opacity-70" fill="none">
            {/* Top-left finder pattern */}
            <rect x="10" y="10" width="50" height="50" rx="4" stroke="#c6ff00" strokeWidth="4"/>
            <rect x="20" y="20" width="30" height="30" rx="2" fill="#c6ff00" fillOpacity=".25"/>
            <rect x="25" y="25" width="20" height="20" rx="1" fill="#c6ff00" fillOpacity=".5"/>
            {/* Top-right finder pattern */}
            <rect x="140" y="10" width="50" height="50" rx="4" stroke="#c6ff00" strokeWidth="4"/>
            <rect x="150" y="20" width="30" height="30" rx="2" fill="#c6ff00" fillOpacity=".25"/>
            <rect x="155" y="25" width="20" height="20" rx="1" fill="#c6ff00" fillOpacity=".5"/>
            {/* Bottom-left finder pattern */}
            <rect x="10" y="140" width="50" height="50" rx="4" stroke="#c6ff00" strokeWidth="4"/>
            <rect x="20" y="150" width="30" height="30" rx="2" fill="#c6ff00" fillOpacity=".25"/>
            <rect x="25" y="155" width="20" height="20" rx="1" fill="#c6ff00" fillOpacity=".5"/>
            {/* Centre data module */}
            <rect x="75" y="75" width="50" height="50" rx="3" fill="#c6ff00" fillOpacity=".1" stroke="#c6ff00" strokeWidth="2" strokeOpacity=".3"/>
            <rect x="85" y="85" width="30" height="30" rx="2" fill="#c6ff00" fillOpacity=".3"/>
            {/* Static data modules */}
            {dataModules.map((m, i) => (
              <rect key={i} x={m.x} y={m.y} width="8" height="8" rx="1" fill="#c6ff00" fillOpacity=".2"/>
            ))}
          </svg>

          {/* Verified member badge */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-black/60 border border-white/[0.08] rounded-lg px-4 py-3 backdrop-blur-sm">
            <div>
              <div className="text-[12px] font-semibold text-white">Ahmed Raza Khan</div>
              <div className="text-[11px] text-white/40">Premium Yearly · Active</div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#c6ff00] animate-pulse" />
              <span className="text-[11px] text-[#c6ff00] font-semibold">VERIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
