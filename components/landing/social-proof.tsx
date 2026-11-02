"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const stats = [
  { value: "12,400+", label: "Members managed" },
  { value: "86,000+", label: "Check-ins recorded" },
  { value: "Rs 4.2M+", label: "Revenue processed" },
  { value: "99.9%", label: "Uptime guarantee" },
]

function StatItem({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const valRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Extract number from string (e.g. "12,400+" -> 12400, "Rs 4.2M+" -> 4.2)
    const numericPart = value.replace(/[^\d.]/g, '')
    const target = parseFloat(numericPart)
    
    // Extract prefix and suffix (e.g. "Rs " and "M+")
    const prefix = value.match(/^[^\d.]*/)?.[0] || ""
    const suffix = value.match(/[^\d.]*$/)?.[0] || ""
    const hasDecimals = value.includes('.')

    const obj = { val: 0 }
    
    const tl = gsap.to(obj, {
      val: target,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ref.current,
        start: "top 90%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        if (!valRef.current) return
        let formatted = ""
        if (hasDecimals) {
          formatted = obj.val.toFixed(1)
        } else {
          formatted = Math.floor(obj.val).toLocaleString()
        }
        valRef.current.textContent = `${prefix}${formatted}${suffix}`
      }
    })

    return () => {
      tl.kill()
    }
  }, [value])

  return (
    <div ref={ref} className="premium-stat-outer">
      <div className="stat-dot" />
      <div className="glass-premium premium-stat-card px-4 md:px-8 py-4 md:py-8">
        <div className="stat-ray" />
        <div className="stat-line stat-topl" />
        <div className="stat-line stat-leftl" />
        <div className="stat-line stat-bottoml" />
        <div className="stat-line stat-rightl" />
        
        <div className="relative z-20">
          <div ref={valRef} className="text-xl md:text-3xl font-bold tracking-tight stat-value">
            0
          </div>
          <div className="text-[10px] md:text-[12px] text-white/80 uppercase tracking-widest mt-1 !font-normal">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SocialProof() {
  return (
    <section className="py-6 md:py-8 px-2 md:px-6 md:mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8 rounded-xl overflow-hidden">
          {stats.map((s, i) => (
            <StatItem key={i} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
