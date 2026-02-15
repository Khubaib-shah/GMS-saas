"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle, Smartphone, BarChart3, Users, Zap, Shield, Play, Trophy, Target, TrendingUp, Star, Rocket, Activity, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-black">
      {/* Navigation */}
      <header className="px-6 h-20 flex items-center justify-between glass sticky top-0 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-black" />
          </div>
          <span className="font-bold text-2xl tracking-tighter text-white">GYM<span className="text-primary">FLOW</span></span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-slate-400">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-primary transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/member/login" className="text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-primary transition-colors hidden sm:block font-black italic">Member Portal</Link>
          <Link href="/login">
            <Button size="sm" className="bg-primary text-black hover:bg-white font-black italic rounded-full px-8 neon-glow transition-all">
              LOGIN
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[95vh] flex items-center pt-20 pb-32 px-6 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -mr-60 -mt-60 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10 neon-glow">
                <Trophy className="w-3 h-3" />
                OFFICIAL SYSTEM #1 GYM SUITE
              </div>

              <div className="space-y-4 mb-10">
                <h1 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter italic text-white">
                  UNLEASH
                </h1>
                <h1 className="text-7xl md:text-9xl font-black leading-[0.8] tracking-tighter italic text-primary neon-text">
                  PERFORMANCE
                </h1>
              </div>

              <p className="max-w-lg text-lg text-slate-400 mb-12 leading-relaxed font-semibold">
                Stop managing, start dominating. The most aggressive, data-driven platform
                engineered for the fitness beast of tomorrow.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="h-16 px-12 text-xl font-black italic rounded-xl bg-primary text-black hover:bg-white hover:text-black transition-all w-full neon-glow group">
                    INITIATE ACCESS
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" className="h-16 px-10 text-lg font-black rounded-xl border border-white/10 hover:bg-white/5 text-white transition-all gap-3 italic">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Play className="w-4 h-4 fill-primary text-primary" />
                  </div>
                  VIEW SYSTEM
                </Button>
              </div>

              <div className="mt-20 grid grid-cols-3 gap-8 border-t border-white/10 pt-10">
                <div>
                  <h4 className="text-5xl font-black italic tracking-tighter text-white">500+</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">DEPLOYED NODES</p>
                </div>
                <div>
                  <h4 className="text-5xl font-black italic tracking-tighter text-white">100K+</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">ACTIVE BEASTS</p>
                </div>
                <div>
                  <h4 className="text-5xl font-black text-primary italic tracking-tighter neon-text">99.9%</h4>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">CORE UPTIME</p>
                </div>
              </div>
            </div>

            {/* Neural Energy Core Section */}
            <div className="relative hidden lg:flex items-center justify-center h-[700px] perspective-2000">
              {/* Ambient Background Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(190,255,0,0.08),transparent_60%)] animate-pulse-glow"></div>

              {/* 3D Core Container */}
              <div className="relative w-96 h-96 preserve-3d group hover:scale-110 transition-transform duration-1000">

                {/* The Pulsing Heart */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 bg-primary/40 rounded-full blur-[60px] animate-pulse-glow"></div>
                  <div className="w-24 h-24 bg-primary rounded-full shadow-[0_0_100px_#BEFF00] border border-white/20 relative z-10 flex items-center justify-center">
                    <Zap className="w-12 h-12 text-black animate-pulse" />
                  </div>
                </div>

                {/* Quantum Rings - Axis X */}
                <div className="absolute inset-0 preserve-3d animate-spin-3d-x">
                  <div className="absolute inset-0 border-[3px] border-primary/30 rounded-full shadow-[0_0_30px_rgba(190,255,0,0.2)]"></div>
                  <div className="absolute inset-0 border-[1px] border-white/10 rounded-full scale-95"></div>
                </div>

                {/* Quantum Rings - Axis Y */}
                <div className="absolute inset-0 preserve-3d animate-spin-3d-y">
                  <div className="absolute inset-0 border-[3px] border-blue-500/30 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.2)]"></div>
                  <div className="absolute inset-0 border-[1px] border-white/10 rounded-full scale-105"></div>
                </div>

                {/* Quantum Rings - Axis Z */}
                <div className="absolute inset-0 preserve-3d animate-spin-3d-z">
                  <div className="absolute inset-0 border-[1px] border-primary/20 rounded-full shadow-[0_0_50px_rgba(190,255,0,0.1)] scale-125 border-dashed"></div>
                </div>

                {/* Orbital Particles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full animate-float-particle shadow-[0_0_15px_currentColor]"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 1.5}s`,
                      opacity: 0.6
                    }}
                  ></div>
                ))}

                {/* Tech Grid Overlay (Subtle) */}
                <div className="absolute inset-[-100px] bg-[url('/grid.svg')] opacity-[0.03] [mask-image:radial-gradient(circle_at_center,white,transparent_70%)] pointer-events-none"></div>
              </div>

              {/* Floating High-Performance HUD Nodes */}
              <div className="absolute top-20 right-0 glass-card bg-slate-900/60 p-6 rotate-12 group-hover:rotate-0 transition-all duration-700 hover:shadow-[0_0_30px_rgba(190,255,0,0.2)] border-l-4 border-l-primary backdrop-blur-md border-white/10">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-primary" />
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">THROUGHPUT</div>
                    <div className="text-2xl font-black italic tracking-tighter text-white">MAXED</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-0 glass-card bg-slate-900/60 p-6 -rotate-12 group-hover:rotate-0 transition-all duration-700 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] border-l-4 border-l-blue-500 backdrop-blur-md border-white/10">
                <div className="flex items-center gap-4">
                  <Shield className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">INTEGRITY</div>
                    <div className="text-2xl font-black italic tracking-tighter text-white">STABLE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-40 px-6 relative border-t border-white/5 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-32">
              <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 italic">Tactical Capabilities</div>
              <h2 className="text-6xl md:text-8xl font-black mb-10 italic tracking-tighter uppercase leading-none text-white">DOMINATE THE <span className="text-primary neon-text underline decoration-white/10 underline-offset-[12px]">SYSTEM</span></h2>
              <div className="w-32 h-2 bg-primary mx-auto neon-glow"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {[
                {
                  icon: <Users className="w-10 h-10" />,
                  title: "ALPHA HUB",
                  desc: "Control member lifecycle with iron-fisted precision and automated reporting.",
                  color: "border-primary",
                  baseBg: "bg-primary/30",
                  hoverBg: "group-hover:bg-primary/30"
                },
                {
                  icon: <Zap className="w-10 h-10" />,
                  title: "NEON SCAN",
                  desc: "0.1s latency QR check-ins that keep your gym floor moving like a machine.",
                  color: "border-blue-500",
                  baseBg: "bg-blue-500/30",
                  hoverBg: "group-hover:bg-blue-500/30"
                },
                {
                  icon: <BarChart3 className="w-10 h-10" />,
                  title: "RADAR ANALYTICS",
                  desc: "Track every cent with deep-dive analytics and predictive revenue modeling.",
                  color: "border-purple-500",
                  baseBg: "bg-purple-500/30",
                  hoverBg: "group-hover:bg-purple-500/30"
                },
                {
                  icon: <Smartphone className="w-10 h-10" />,
                  title: "COACH LINK",
                  desc: "High-octane trainer profiles to manage schedules and member progress sessions.",
                  color: "border-orange-500",
                  baseBg: "bg-orange-500/30",
                  hoverBg: "group-hover:bg-orange-500/30"
                },
                {
                  icon: <Shield className="w-10 h-10" />,
                  title: "STEALTH BILLING",
                  desc: "Seamless, secure payment processing that never misses a heartbeat.",
                  color: "border-red-500",
                  baseBg: "bg-red-500/30",
                  hoverBg: "group-hover:bg-red-500/30"
                },
                {
                  icon: <Globe className="w-10 h-10" />,
                  title: "GLOBAL OPS",
                  desc: "Scale across borders with multi-branch management and HQ master control.",
                  color: "border-teal-400",
                  baseBg: "bg-teal-400/30",
                  hoverBg: "group-hover:bg-teal-400/30"
                }
              ].map((feature, i) => (
                <div key={i} className={cn("glass-card bg-white/5 group p-12 relative overflow-hidden flex flex-col items-center text-center transition-all duration-500 border-b-4", feature.color)}>
                  <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full translate-x-10 -translate-y-10 group-hover:scale-[10] transition-transform duration-700 ease-in-out -z-0", feature.baseBg, feature.hoverBg)}></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-10 p-5 rounded-2xl bg-slate-950 border border-white/10 text-primary group-hover:neon-glow group-hover:scale-110 transition-all duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-3xl font-black italic mb-6 text-white group-hover:text-primary transition-colors tracking-tighter uppercase">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed font-bold uppercase text-[11px] tracking-widest">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-40 px-6 relative overflow-hidden border-t border-white/5 bg-slate-950">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-32">
              <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 italic">Pricing Deployment</div>
              <h2 className="text-6xl md:text-8xl font-black mb-10 italic tracking-tighter uppercase leading-none text-white">STRATEGIC <span className="text-primary neon-text">INVESTMENT</span></h2>
              <div className="w-32 h-2 bg-primary mx-auto neon-glow"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  name: "SOLO OPS",
                  price: "99",
                  desc: "Perfect for single-unit combat gyms.",
                  features: ["Up to 500 Members", "Basic Analytics", "QR Entry Pro", "Email Support"],
                  tier: "LITE"
                },
                {
                  name: "ELITE FORCE",
                  price: "199",
                  desc: "Advanced arsenal for high-growth hubs.",
                  features: ["Unlimited Members", "Deep Radar Analytics", "Priority Support", "Trainer Module", "Staff Accounts"],
                  popular: true,
                  tier: "STND"
                },
                {
                  name: "MASTER HQ",
                  price: "499",
                  desc: "Complete dominion for franchises.",
                  features: ["Multiple Branches", "HQ Master Control", "Custom Deployment", "Dedicated Tactical Support", "API Access"],
                  tier: "ENTR"
                }
              ].map((plan, i) => (
                <div key={i} className={cn(
                  "glass-card bg-white/5 p-12 flex flex-col relative overflow-hidden transition-all duration-500 hover:scale-105 group border-b-8 shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
                  plan.popular ? "border-primary" : "border-white/10"
                )}>
                  {/* Sliding Border Effect */}
                  <div className={cn(
                    "absolute top-0 left-0 w-full h-2 transition-all duration-500 ease-in-out group-hover:h-full -z-0 opacity-20 group-hover:opacity-100",
                    plan.popular ? "bg-primary" : "bg-slate-700"
                  )}></div>

                  {plan.popular && (
                    <div className="absolute top-10 -right-16 bg-primary text-black font-black italic py-2 px-16 rotate-45 text-[10px] tracking-widest shadow-xl z-20">
                      COMMAND CHOICE
                    </div>
                  )}

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 italic group-hover:text-white transition-colors">{plan.tier}</div>
                    <h3 className="text-4xl font-black italic mb-2 tracking-tighter uppercase text-white group-hover:text-primary transition-colors">{plan.name}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase italic mb-8 h-10 group-hover:text-white/80 transition-colors">{plan.desc}</p>

                    <div className="flex items-end gap-2 mb-10">
                      <span className="text-[10px] font-black italic text-slate-500 pb-2 group-hover:text-white transition-colors">USD</span>
                      <span className="text-6xl font-black italic tracking-tighter text-white group-hover:text-white transition-colors">${plan.price}</span>
                      <span className="text-[10px] font-black italic text-slate-500 pb-2 group-hover:text-white transition-colors">/ MO</span>
                    </div>

                    <div className="space-y-4 mb-12 flex-1">
                      {plan.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white/90 transition-colors">
                          <CheckCircle className={cn("w-4 h-4 shrink-0", plan.popular ? "text-primary group-hover:text-white" : "text-primary")} />
                          {f}
                        </div>
                      ))}
                    </div>

                    <Button className={cn(
                      "w-full py-8 h-auto font-black italic text-lg rounded-xl transition-all uppercase tracking-tighter z-20",
                      plan.popular ? "bg-primary text-black hover:bg-white neon-glow" : "bg-white/5 hover:bg-white/10 border border-white/10 text-white"
                    )}>
                      COMMENCE OPERATION
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-40 px-6 relative overflow-hidden border-t border-white/5 bg-slate-950">
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] -ml-[400px]"></div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div className="relative">
              {/* Technical Grid Overlay */}
              <div className="absolute inset-x-0 -top-10 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>

              <div className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-8 italic flex items-center gap-4">
                <span className="opacity-50">DOC_TYPE: STRATEGIC_INTEL</span>
                <div className="h-px flex-1 bg-primary/20"></div>
              </div>

              <h2 className="text-6xl md:text-8xl font-black mb-10 italic tracking-tighter uppercase leading-[0.8] text-white">
                POWERED <br /> BY <span className="text-primary neon-text">ADRENALINE</span>
              </h2>

              <p className="text-xl text-slate-400 font-semibold mb-12 leading-relaxed italic border-l-2 border-primary/20 pl-6">
                We didn't build just another management tool. We engineered a high-performance engine
                to fuel the elite of the fitness industry.
              </p>

              <div className="grid grid-cols-1 gap-6">
                {[
                  {
                    icon: <Rocket className="w-6 h-6" />,
                    title: "AGGRESSIVE INNOVATION",
                    desc: "Constant tactical updates to stay ahead of the curve. Zero latency, zero compromise.",
                    status: "VERIFIED",
                    accent: "text-blue-500"
                  },
                  {
                    icon: <Shield className="w-6 h-6" />,
                    title: "UNBREAKABLE TRUST",
                    desc: "Protecting your revenue and data like an iron fortress. End-to-end tactical encryption.",
                    status: "ACTIVE_PROT",
                    accent: "text-primary"
                  }
                ].map((item, i) => (
                  <div key={i} className="group relative p-8 glass-card bg-white/5 border border-white/10 hover:border-primary/20 transition-all overflow-hidden flex gap-6">
                    {/* Scanning Beam (Visible on Hover) */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/30 shadow-[0_0_10px_rgba(190,255,0,0.3)] animate-scan"></div>
                    </div>

                    <div className={cn("w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shrink-0 transition-all relative z-10", item.accent, "group-hover:neon-glow group-hover:scale-110")}>
                      {item.icon}
                    </div>

                    <div className="relative z-10 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest">{item.status}</span>
                        </div>
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                        {item.desc}
                      </p>
                    </div>

                    {/* Corner Accent */}
                    <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/10 group-hover:border-primary/30 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex flex-col gap-10">
              {/* Module 01: Biometric Radar (Top) */}
              <div className="glass-card bg-white/5 p-6 border border-white/10 relative overflow-hidden group hover:border-primary/20 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">SYSTEM_RADAR: ACTIVE</span>
                  </div>
                  <Activity className="w-4 h-4 text-primary opacity-50" />
                </div>
                <div className="flex items-center gap-10">
                  <div className="relative w-24 h-24 shrink-0">
                    <div className="absolute inset-0 border border-primary/20 rounded-full"></div>
                    <div className="absolute inset-2 border border-primary/10 rounded-full border-dashed animate-spin-slow"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full animate-radar origin-center"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#BEFF00]"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                    <div>
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">INTEGRITY</div>
                      <div className="text-xl font-black italic tracking-tighter uppercase text-white">MAX_CAP</div>
                    </div>
                    <div>
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">LATENCY</div>
                      <div className="text-xl font-black italic text-primary tracking-tighter uppercase">0.02ms</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module 02: 3D Tactical ID (Center) */}
              <div className="relative flex items-center justify-center py-6 perspective-2000 group">
                {/* 3D Kinetic Card Container - Scaled to fit stack */}
                <div className="relative w-full aspect-[1.8/1] preserve-3d transition-transform duration-700 ease-out hover:rotate-y-12 hover:rotate-x-[-10deg]">
                  {/* Card Glow Base */}
                  <div className="absolute inset-[-40px] bg-primary/20 rounded-[40px] blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                  {/* The Glass Card Body */}
                  <div className="absolute inset-0 glass-card bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden preserve-3d flex p-6 shadow-2xl backdrop-blur-3xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-1/2 -skew-x-12 animate-light-sweep pointer-events-none"></div>

                    {/* Avatar */}
                    <div className="w-[30%] flex flex-col gap-3 relative">
                      <div className="w-full aspect-square rounded-xl border border-white/10 bg-slate-900 overflow-hidden relative group-hover:border-primary/50 transition-colors">
                        <img
                          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
                          className="w-full h-full object-cover grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700"
                          alt="Tactical Avatar"
                        />
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-primary shadow-[0_0_10px_#BEFF00] animate-scan"></div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[85%]"></div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 pl-6 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">MEMBER_001</span>
                          <Zap className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-2 drop-shadow-lg leading-none text-white">ALPHA_INITIATE</h4>
                        <div className="inline-block px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[7px] font-black text-primary uppercase tracking-widest italic">SEC_LEVEL: ELITE_9</div>
                      </div>
                      <div className="flex items-end justify-between border-t border-white/10 pt-4">
                        <div className="space-y-0.5">
                          <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest">EXPIRY_DATE</div>
                          <div className="text-xs font-black italic text-white">24_JUL_2026</div>
                        </div>
                        <Shield className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Badge Overlay */}
                <div className="absolute -bottom-4 -left-4 glass-card bg-slate-900 p-5 border-l-4 border-l-primary shadow-2xl z-20 group-hover:scale-110 transition-transform">
                  <Star className="text-primary w-5 h-5 mb-2 fill-primary" />
                  <div className="text-xl font-black italic tracking-tighter text-white">4.9/5</div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SQUAD RATING</div>
                </div>
              </div>

              {/* Module 03: Performance Log (Bottom) */}
              <div className="glass-card bg-white/5 border border-white/10 h-40 overflow-hidden relative group hover:border-primary/20 transition-all">
                <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-slate-950 to-transparent z-10 p-3 flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">SYSTEM_RADAR: ACTIVE</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-primary/40 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="p-4 pt-10 space-y-3 animate-data-flow">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 opacity-40 hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-mono text-slate-500">[{new Date().toLocaleTimeString()}] ADMISSION_GRANTED: UID_0{i}</span>
                      <span className="text-[9px] font-mono text-primary">SECURED</span>
                    </div>
                  ))}
                  {[...Array(10)].map((_, i) => (
                    <div key={i + 10} className="flex items-center justify-between border-b border-white/5 pb-2 opacity-40">
                      <span className="text-[9px] font-mono text-slate-500">[{new Date().toLocaleTimeString()}] SYSTEM_RESTORE: POINT_V{i}</span>
                      <span className="text-[9px] font-mono text-blue-500">STABLE</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-40 px-6 relative overflow-hidden border-t border-white/5 bg-slate-950">
          <div className="absolute inset-0 bg-primary/10"></div>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] mb-12 italic text-slate-400">
              FINAL OVERRIDE DETECTED
            </div>
            <h2 className="text-7xl md:text-9xl font-black mb-12 italic tracking-tighter uppercase leading-[0.8] text-white">READY TO <br /> <span className="text-primary neon-text">EVOLVE?</span></h2>
            <p className="text-2xl text-slate-400 mb-16 max-w-2xl mx-auto font-black italic leading-tight uppercase tracking-widest">
              Stop managing, start dominating. <br /> Join the elite league today.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-24 px-20 text-3xl font-black italic rounded-xl bg-primary text-black hover:bg-white neon-glow group transition-all tracking-tighter">
                COMMENCE JOINING
                <ArrowRight className="ml-4 w-10 h-10 group-hover:translate-x-4 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 px-6 border-t border-white/10 glass bg-slate-950 text-slate-400 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1/2 h-1 bg-gradient-to-r from-primary to-transparent"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 items-start relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 rounded-xl bg-primary neon-glow">
                <Zap className="w-8 h-8 text-black" />
              </div>
              <span className="font-black text-3xl text-white italic tracking-tighter">GYMFLOW</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest leading-relaxed max-w-xs italic text-slate-500">
              Next-generation tactical management for fitness elite.
              Engineering excellence since 2026.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8 italic">CORE NAVIGATION</h5>
              <div className="flex flex-col gap-5 text-[11px] font-black tracking-widest">
                <Link href="#features" className="hover:text-primary transition-colors uppercase italic">Tactical Features</Link>
                <Link href="#pricing" className="hover:text-primary transition-colors uppercase italic">Pricing Plans</Link>
                <Link href="#about" className="hover:text-primary transition-colors uppercase italic">Mission Intel</Link>
              </div>
            </div>
            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-[0.3em] mb-8 italic">LEGAL PROTOCOL</h5>
              <div className="flex flex-col gap-5 text-[11px] font-black tracking-widest">
                <Link href="#" className="hover:text-primary transition-colors uppercase italic">Privacy Vault</Link>
                <Link href="#" className="hover:text-primary transition-colors uppercase italic">Service Terms</Link>
                <Link href="#" className="hover:text-primary transition-colors uppercase italic">Refund Policy</Link>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-center md:items-end">
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mb-4 italic">© 2026 GYMFLOW SAAS COMMAND</div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-primary italic neon-text">ENGINEERING THE FUTURE OF FORCE</div>
            <div className="mt-10 flex gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all cursor-pointer group">
                  <Activity className="w-4 h-4 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
