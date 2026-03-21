import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"

const Antigravity = dynamic(() => import("./antigravity"), { ssr: false })

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          THE NEW STANDARD IN GYM MANAGEMENT
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
          Run Your Entire Gym <br className="hidden md:block" /> From One Platform
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
          Manage members, staff, payments, and operations with a single powerful system built for modern gyms. Say goodbye to spreadsheets and chaos.
        </p>

        <div style={{ width: '100%', height: '400px', position: 'relative', marginBottom: '2.5rem', zIndex: 10 }}>
          <Antigravity
            count={300}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color="#5227FF"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="#request-demo" className="w-full sm:w-auto">
            <Button size="lg" className="h-14 px-8 text-base font-semibold rounded-lg bg-primary text-black hover:bg-primary/90 transition-all w-full flex items-center justify-center group shadow-[0_0_30px_rgba(190,255,0,0.3)]">
              Request Demo
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="h-14 px-8 text-base font-medium rounded-lg border-white/10 hover:bg-white/5 text-white transition-all w-full flex items-center justify-center gap-2">
              <Play className="w-4 h-4 fill-current" />
              See How It Works
            </Button>
          </Link>
        </div>
      </div>

      {/* Dashboard Preview Mockup */}
      <div className="mt-10 w-full max-w-6xl mx-auto relative z-10 group perspective-1000">
        <Image src="/assets/dashboard.png" alt="GymFlow Dashboard Mockup" className="w-full h-auto block object-cover relative z-10" width={1000} height={1000} />
      </div>
    </section>
  )
}
