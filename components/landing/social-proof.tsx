"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

const stats = [
  { value: "12,400+", label: "Members managed" },
  { value: "86,000+", label: "Check-ins recorded" },
  { value: "Rs 4.2M+", label: "Revenue processed" },
  { value: "99.9%", label: "Uptime guarantee" },
]

function StatItem({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState("0")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    // Extract number from string (e.g. "12,400+" -> 12400, "Rs 4.2M+" -> 4.2)
    const numericPart = value.replace(/[^\d.]/g, '')
    const target = parseFloat(numericPart)
    
    // Extract prefix and suffix (e.g. "Rs " and "M+")
    // We look for anything that isn't a digit or dot at the start and end
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
        let formatted = ""
        if (hasDecimals) {
          formatted = obj.val.toFixed(1)
        } else {
          formatted = Math.floor(obj.val).toLocaleString()
        }
        setDisplayValue(`${prefix}${formatted}${suffix}`)
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
          <div className="text-xl md:text-3xl font-bold tracking-tight stat-value">{displayValue}</div>
          <div className="text-[10px] md:text-[12px] text-white/40 uppercase tracking-widest mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}

export function SocialProof() {
  return (
    <section className="py-4 md:py-8 px-6 mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-8 rounded-xl overflow-hidden ">
          {stats.map((s, i) => (
            <StatItem key={i} value={s.value} label={s.label} />
          ))}
        </div>
      </div>
    </section>
  )
}
