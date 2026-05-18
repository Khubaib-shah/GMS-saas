"use client";

import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { SectionHeading } from "./section-heading";

export function HeroSection() {
  const mockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const mockup = mockupRef.current;
    if (!mockup) return;

    let mm = gsap.matchMedia();

    // Desktop/Tablet: Keep premium 3D rotate and scale animation
    mm.add("(min-width: 768px)", () => {
      gsap.set(mockup, {
        rotationX: 60,
        scale: 0.7,
        transformPerspective: 1000,
        transformOrigin: "top center",
        opacity: 1,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mockup,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });

      tl.to(mockup, {
        rotationX: 0,
        scale: 1,
        duration: 1,
        ease: "power1.out",
      }).to(mockup, {
        rotationX: -20,
        scale: 1.25,
        opacity: 0,
        duration: 1,
        ease: "power1.in",
      });

      return () => {
        tl.kill();
      };
    });

    // Mobile (iPhone 12, etc.): Disable 3D transforms and complex scrubbing to avoid lag/freezing
    mm.add("(max-width: 767px)", () => {
      gsap.set(mockup, {
        rotationX: 0,
        scale: 1,
        transformPerspective: 0,
        opacity: 1,
      });

      // Simple, performant fade-in and slight scale up instead of raw scroll-scrubbing
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mockup,
          start: "top 90%",
          toggleActions: "play none none reverse",
        },
      });

      tl.fromTo(mockup,
        { opacity: 0.8, scale: 0.95 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
      );

      return () => {
        tl.kill();
      };
    });

    return () => {
      mm.revert();
    };
  }, []);
  return (
    <section className="relative pt-40 pb-0 px-6 overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Subtle top radial */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c6ff00]/8 blur-[120px] rounded-full -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto text-center">
        <SectionHeading
          as="h1"
          size="hero"
          title="Stop losing money.\n"
          highlight="Run your gym"
          subtitle="smarter."
          delay={.4}
        />

        {/* Sub */}
        
        <p className="text-[15px] md:text-[17px] text-white/80 max-w-xl mx-auto leading-relaxed mb-6 md:mb-8">
          Memberships, smart billing, automated QR attendance, automated reminders,
          workout tracking, POS system, and much more — everything your gym needs to run on autopilot.
        </p>

        {/* CTAs */}
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 mb-6 md:mb-10">
          <Link href="#how-it-works">
            <button className="btn-hero-reveal h-12 px-4 sm:px-8">
              <div className="hero-text flex items-center gap-1.5 sm:gap-2.5">
                <Play className="size-3.5 fill-current" />
                {"See how it works".split(" ").map((w, i) => (
                  <span key={i} className={i === 0 ? "!hidden md:!inline-block" : ""}>{w}</span>
                ))}
              </div>
              <div className="hero-clone flex items-center gap-1.5 sm:gap-2.5">
                <Play className="size-3.5 fill-current" />
                {"See how it works".split(" ").map((w, i) => (
                  <span key={i} className={i === 0 ? "!hidden md:!inline-block" : ""}>{w}</span>
                ))}
              </div>
            </button>
          </Link>
          <Link href="/signup">
            <button className="btn-nav-secondary h-12 md:h-12 px-4 sm:px-8">
              <span className="flex items-center gap-1.5 sm:gap-2 text-[13px] md:text-[15px] font-bold whitespace-nowrap">
                Start free trial
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </span>
            </button>
          </Link>
        </div>

        {/* Browser mockup */}
        <div ref={mockupRef} className="relative mx-auto max-w-5xl">
          {/* Browser chrome */}
          <div className="rounded-t-xl border border-white/[0.08] border-b-0 bg-white/[0.04] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
            </div>
            <div className="flex-1 mx-4">
              <div className="h-5 rounded bg-white/[0.06] max-w-[200px] mx-auto flex items-center justify-center">
                <span className="text-[10px] text-white/30">
                  app.gymflow.pk/dashboard
                </span>
              </div>
            </div>
          </div>
          {/* Screenshot */}
          <div className="border border-white/[0.08] border-t-0 rounded-b-xl overflow-hidden">
            <Image
              src="/assets/dashboard/owner-dashboard.png"
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
  );
}
