"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle, Smartphone, BarChart3, Users, Zap, Shield, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-white">
      {/* Navigation */}
      <header className="px-6 h-20 flex items-center justify-between border-b border-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">GymFlow</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/member/login" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">Member Portal</Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Admin Login</Link>
          <Link href="/login">
            <Button size="sm" className="bg-primary text-white hover:bg-primary/90 rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(147,51,234,0.1),transparent_50%)]"></div>
          
          <div className="max-w-7xl mx-auto relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Next-Gen Gym Management
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-slate-500">
              Elevate Your Fitness <br />
              Business Efficiency
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
              The all-in-one platform for trainers and gym owners. Manage members, 
              automate subscriptions, and track performance with stunning clarity.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/login">
                <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-black hover:bg-slate-100 group transition-all">
                  Start Managing Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" className="h-14 px-8 text-lg rounded-full border border-white/10 hover:bg-white/5 transition-all gap-2">
                <Play className="w-5 h-5 fill-current" />
                Watch Demo
              </Button>
            </div>
            
            {/* Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto rounded-3xl border border-white/10 p-2 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
                alt="GymFlow Dashboard Preview" 
                className="w-full rounded-2xl opacity-60 group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                 <div className="p-4 rounded-2xl bg-primary/20 border border-primary/50 backdrop-blur-xl mb-4 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-12 h-12 text-primary fill-primary/20" />
                 </div>
                 <h3 className="text-3xl font-bold mb-2">Powering 500+ Gyms</h3>
                 <p className="text-slate-300">Experience the world's most intuitive gym interface.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Master Your Management</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Everything you need to run a successful gym, from a single unified dashboard.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Member Hub",
                  desc: "Comprehensive member profiles with automated status tracking and history logs."
                },
                {
                  icon: <Zap className="w-6 h-6" />,
                  title: "Smart Check-in",
                  desc: "Ultra-fast QR code based attendance with real-time capacity monitoring."
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Deep Analytics",
                  desc: "Visualize revenue trends and membership growth with interactive charts."
                },
                {
                  icon: <Smartphone className="w-6 h-6" />,
                  title: "Trainer Portal",
                  desc: "Dedicated profiles for trainers to manage their assigned members and schedules."
                },
                {
                  icon: <Shield className="w-6 h-6" />,
                  title: "Secure Billing",
                  desc: "Automated subscription renewals and payment history with secure processing."
                },
                {
                  icon: <ArrowRight className="w-6 h-6" />,
                  title: "Global Search",
                  desc: "Instantly find members, plans, or payments with a powerful unified search bar."
                }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-3xl border border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-b from-slate-950 to-primary/20 overflow-hidden relative">
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to Transform Your Gym?</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join hundreds of gym owners who have reclaimed their time and boosted their revenue with GymFlow.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 group transition-all">
                Get Started for Free
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-white" />
            <span className="font-bold text-white">GymFlow</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-sm">© 2026 GymFlow SaaS. Built with ❤️ for fitness excellence.</p>
        </div>
      </footer>
    </div>
  )
}

