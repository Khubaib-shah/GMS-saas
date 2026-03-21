import { ArrowRight, Database, Zap, Lock } from "lucide-react"
import Image from "next/image"

export function ProductShowcase() {
  return (
    <section id="product" className="py-32 px-6 relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none -ml-[400px]"></div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
        <div className="flex-1 w-full order-2 lg:order-1">
          {/* Dashboard Image Mockup */}
          <div className="relative w-full lg:w-[125%] xl:w-[135%] lg:-ml-[12%] xl:-ml-[25%] mx-auto lg:my-auto z-20">
            {/* The main dashboard image with rotation and glow */}
            <div className="relative">
              <Image src="/assets/dashboard.png" alt="GymFlow Dashboard Mockup" className="w-full h-auto block object-cover relative z-10" width={1000} height={1000} />
            </div>
          </div>
        </div>

        <div className="flex-1 order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            ENTERPRISE SCALE
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Engineered for <br /> peak performance.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed mb-8">
            Behind the sleek interface is a relentless data processing engine. We ensure that
            your financial records, member data, and critical operations are processed
            instantly and securely.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 border border-white/5 bg-white/5 rounded-xl">
              <Zap className="w-6 h-6 text-primary mb-3" />
              <div className="text-white font-semibold text-lg mb-1">Zero Latency</div>
              <div className="text-slate-400 text-sm">Real-time sync across all your devices and branches.</div>
            </div>
            <div className="p-5 border border-white/5 bg-white/5 rounded-xl">
              <Database className="w-6 h-6 text-blue-400 mb-3" />
              <div className="text-white font-semibold text-lg mb-1">Infinite Scale</div>
              <div className="text-slate-400 text-sm">Handles millions of attendance logs without breaking a sweat.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
