"use client"

import { useEffect, useRef, Fragment } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { SectionHeading } from "./section-heading"
import { cn } from "@/lib/utils"

const steps = [
  {
    n: "01",
    title: "Sign Up",
    description: "Create your branch account in seconds and get instant access.",
  },
  {
    n: "02",
    title: "Add Members",
    description: "Import your existing members or add new ones with a few clicks.",
  },
  {
    n: "03",
    title: "Automate Billing",
    description: "Set up subscription plans and let the system handle payments.",
  },
  {
    n: "04",
    title: "Go Live",
    description: "Start scanning QR codes and track your gym's growth.",
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgPathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

    const path = svgPathRef.current
    const dot = dotRef.current
    const container = containerRef.current
    
    if (!container) return;

    let mm = gsap.matchMedia();

    // Large screens (Desktop/Tablet): Run vertical timeline SVG path tracking and dot scrubbing
    mm.add("(min-width: 1024px)", () => {
      if (!path || !dot) return;

      const updatePath = () => {
        const height = container.offsetHeight
        path.setAttribute('d', `M 1 0 L 1 ${height}`)
        
        const pathLength = path.getTotalLength()
        gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength })
      }
      
      updatePath()
      window.addEventListener('resize', updatePath)

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top center",
          end: "bottom center",
          scrub: 1.5,
        },
      })

      tl.to(path, { strokeDashoffset: 0, ease: "none" }, 0)
      
      tl.to(dot, {
        motionPath: {
          path: path,
          align: path,
          alignOrigin: [0.5, 0.5],
        },
        duration: 1,
        ease: "none"
      }, 0)

      return () => {
        window.removeEventListener('resize', updatePath)
        tl.kill()
      }
    });

    // Handle card entrance animations cleanly across different breakpoints
    mm.add({
      isDesktop: "(min-width: 1024px)",
      isMobile: "(max-width: 1023px)"
    }, (context) => {
      const { isDesktop } = context.conditions as { isDesktop: boolean };
      const cards = container.querySelectorAll(".how-it-works-card")
      const activeTriggers: ScrollTrigger[] = [];

      cards?.forEach((card, i) => {
        const startX = isDesktop ? (i % 2 === 0 ? 50 : -50) : 0;
        const startY = isDesktop ? 0 : 30; // Slide upwards on mobile instead of side-to-side

        const anim = gsap.fromTo(card, 
          { opacity: 0, x: startX, y: startY },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          }
        )
        if (anim.scrollTrigger) {
          activeTriggers.push(anim.scrollTrigger);
        }
      })

      return () => {
        activeTriggers.forEach(st => st.kill());
      };
    });

    return () => {
      mm.revert();
    };
  }, [])

  return (
    <section id="how-it-works" className="py-10 md:py-32 px-2 md:px-6 border-t border-white/[0.06] overflow-hidden" ref={containerRef}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 md:mb-24">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-4">How it works</div>
          <SectionHeading
            title="Up and running in"
            highlight="under 10 minutes"
            align="center"
            className="mb-4"
          />
          <p className="text-[15px] text-white/80 leading-relaxed max-w-xl mx-auto">
            Zero setup. Zero training. Just sign up and automate your entire gym from day one.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative">
          {/* SVG Path - Desktop only */}
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px hidden lg:block">
            <svg width="2" height="100%" className="overflow-visible" preserveAspectRatio="none">
              <path
                ref={svgPathRef}
                d="M 1 0 L 1 1000"
                stroke="rgba(133, 255, 64, 0.2)"
                strokeWidth="2"
                fill="none"
                className="h-full"
                id="timeline-path"
              />
            </svg>
            {/* The Dot */}
            <div 
              ref={dotRef}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_rgba(133,255,0,0.8)] z-50 pointer-events-none"
            />
          </div>

          <div className="flex flex-col gap-2 lg:!gap-0">
            {steps.map((s, i) => (
              <Fragment key={i}>
                <div 
                  className={cn(
                    "flex flex-col lg:flex-row items-center gap-6 md:gap-12 lg:gap-0",
                    i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  )}
                >
                  {/* Content Side */}
                  <div className="flex-1 w-full lg:w-1/2">
                    <div className={cn(
                      "how-it-works-card",
                      i % 2 === 0 ? "lg:pr-24 text-center lg:text-right" : "lg:pl-24 text-center lg:text-left"
                    )}>
                      <div className="premium-stat-outer inline-block w-full max-w-md">
                        <div className="stat-dot" />
                        <div className="premium-stat-card p-4 md:p-8 text-left">
                          <div className="stat-ray" />
                          <div className="stat-line stat-topl" />
                          <div className="stat-line stat-leftl" />
                          <div className="stat-line stat-bottoml" />
                          <div className="stat-line stat-rightl" />
                          
                          <div className="flex flex-col gap-4 relative z-20">
                            <div className="w-12 h-12 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center text-primary font-black text-xl">
                              {s.n}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                              <p className="text-sm text-white/70 leading-relaxed">{s.description}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Gap for the line */}
                  <div className="hidden lg:block w-24 flex-shrink-0" />

                  {/* Empty Side to maintain zig-zag */}
                  <div className="hidden lg:block flex-1 w-1/2" />
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
