import { SectionHeading } from "./section-heading"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="md:py-32 md:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        <div
          className="relative md:rounded-2xl md:border md:border-white/[0.08] overflow-hidden md:px-8 md:py-20 py-6 text-center"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(198,255,0,0.07) 0%, transparent 70%), rgba(255,255,255,0.01)",
          }}
        >
          {/* Dot grid inside the box */}
          <div
            className="absolute inset-0 -z-10 opacity-40"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <SectionHeading
            title="Ready To Take "
            highlight="Control Of Your Gym?"
            align="center"
            className="md:mb-4"
          />
          <p className="text-[15px] text-white/80 max-w-md mx-auto mb-4 md:mb-10 leading-relaxed">
            Join thousands of gym owners who switched to GymFlow and never looked back.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4">
            <Link href="/signup">
              <button className="btn-nav-secondary h-12 px-8">
                <span className="flex items-center gap-2 text-[15px] font-bold">
                  Start Your Free Trial
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </span>
              </button>
            </Link>
            <a href="https://wa.me/923149784156" target="_blank" rel="noopener noreferrer">
              <button className="btn-hero-reveal h-12 px-8">
                <div className="hero-text flex items-center gap-2">
                  {"Talk to us on WhatsApp".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                </div>
                <div className="hero-clone flex items-center gap-2">
                  {"Talk to us on WhatsApp".split(" ").map((w, i) => <span key={i}>{w}</span>)}
                </div>
              </button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
