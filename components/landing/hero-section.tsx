"use client"

import { ArrowRight, Play } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export function HeroSection() {
  return (
    <section className="relative pt-40 pb-0 px-6 overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Subtle top radial */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c6ff00]/8 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-white/60 text-[11px] font-medium tracking-widest uppercase mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff00] animate-pulse" />
          Now live for gyms in Pakistan
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.04em] text-white leading-[1.05] mb-6">
          Stop losing money.<br />
          <span className="text-[#c6ff00]">Run your gym</span> smarter.
        </h1>

        {/* Sub */}
        <p className="text-[15px] sm:text-[17px] text-white/50 max-w-xl mx-auto leading-relaxed mb-10">
          Memberships, QR attendance, billing, point-of-sale, and workout tracking — all in one platform. Built for gym owners in Pakistan.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link href="/signup">
            <button className="inline-flex items-center gap-2 h-11 px-6 rounded-lg bg-[#c6ff00] text-black text-[14px] font-semibold hover:bg-[#d4ff33] transition-colors">
              Start free trial
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </Link>
          <Link href="#how-it-works">
            <button className="inline-flex items-center gap-2 h-11 px-6 rounded-lg border border-white/10 text-white/70 text-[14px] hover:bg-white/[0.06] hover:text-white transition-colors">
              <Play className="w-3.5 h-3.5 fill-current" />
              See how it works
            </button>
          </Link>
        </div>

        {/* Browser mockup */}
        <div className="relative mx-auto max-w-5xl">
          {/* Browser chrome */}
          <div className="rounded-t-xl border border-white/[0.08] border-b-0 bg-white/[0.04] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-5 rounded bg-white/[0.06] max-w-[200px] mx-auto flex items-center justify-center">
                <span className="text-[10px] text-white/30">app.gymflow.pk/dashboard</span>
              </div>
            </div>
          </div>
          {/* Screenshot */}
          <div className="border border-white/[0.08] border-t-0 rounded-b-xl overflow-hidden">
            <Image
              src="/assets/dashboard.png"
              alt="GymFlow Dashboard"
              width={1200}
              height={720}
              className="w-full h-auto block"
              priority
            />
          </div>
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  )
}
