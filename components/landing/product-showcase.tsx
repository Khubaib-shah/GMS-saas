"use client"

import { SectionHeading } from "./section-heading"
import { Check, ShoppingBag } from "lucide-react"
import { useState } from "react"

const posItems = [
  { emoji: "🥤", name: "Whey Protein Shake", qty: 2, price: 600 },
  { emoji: "💧", name: "Water Bottle", qty: 1, price: 50 },
  { emoji: "👕", name: "Gym T-Shirt (L)", qty: 1, price: 1200 },
]

const checks = [
  "Add products with photos, prices, and stock levels",
  "Ring up sales in seconds from the front desk",
  "Track product revenue separately from memberships",
  "Low-stock alerts so you never run out",
]

export function ProductShowcase() {
  const [charged, setCharged] = useState(false)
  const total = posItems.reduce((sum, i) => sum + i.price * i.qty, 0)

  return (
    <section id="product" className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c6ff00] mb-4">Point of Sale</div>
          <SectionHeading
            title="Sell from the front desk in two taps"
            align="left"
            className="mb-5"
          />
          <p className="text-[15px] text-white/40 leading-relaxed mb-8">
            Your receptionist can ring up a protein shake or a gym T-shirt without leaving the dashboard. Every sale is tracked separately from membership revenue so your books always add up.
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

        {/* Right: POS mockup */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-white/40" />
              <span className="text-[14px] font-semibold text-white">Quick Sale</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c6ff00] animate-pulse" />
              <span className="text-[11px] text-[#c6ff00] font-semibold uppercase tracking-wide">Live</span>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2 mb-4">
            {posItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.emoji}</span>
                  <span className="text-[13px] text-white/70">{item.name}</span>
                  <span className="text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] rounded px-1.5 py-0.5">×{item.qty}</span>
                </div>
                <span className="text-[13px] text-white/60">Rs {(item.price * item.qty).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-white/[0.06] mb-4">
            <span className="text-[13px] text-white/40">Total</span>
            <span className="text-[16px] font-bold text-[#c6ff00]">Rs {total.toLocaleString()}</span>
          </div>

          {/* Charge button */}
          <button
            onClick={() => { setCharged(true); setTimeout(() => setCharged(false), 2000) }}
            className="btn-nav-secondary w-full h-11"
          >
            <span className="flex items-center justify-center gap-2">
              {charged ? (
                <><Check className="w-4 h-4" strokeWidth={2.5} /> Payment recorded</>
              ) : (
                <>Charge Rs {total.toLocaleString()} →</>
              )}
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
