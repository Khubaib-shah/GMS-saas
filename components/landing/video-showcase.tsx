"use client";

import { SectionHeading } from "./section-heading";
import { Play } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function VideoShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    const el = videoRef.current;
    if (!el) return;

    let mm = gsap.matchMedia();

    // Desktop/Tablet: Scale up from 0.7 to 1 on scroll scrub (avoiding extreme scale factor jumps)
    mm.add("(min-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          end: "center center",
          scrub: 0.8,
        }
      });

      tl.fromTo(el, 
        { scale: 0.85, opacity: 0.7 },
        { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
      );

      return () => {
        tl.kill();
      };
    });

    // Mobile: Clean, non-scrubbing fade/scale entrance
    mm.add("(max-width: 767px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          toggleActions: "play none none reverse",
        }
      });

      tl.fromTo(el, 
        { scale: 0.95, opacity: 0.8 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }
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
    <section 
      className="py-6 md:py-32 px-2 md:px-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(to right, #000000, #0d1318)' }}
    >
      {/* Ambient Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center w-full">
        <div className="text-center mb-6 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-widest uppercase">
            Product Walkthrough
          </div>
          <SectionHeading
            title="See GymFlow in Action."
            className="mb-6"
          />
          <p className="text-lg max-w-2xl mx-auto text-white/80">
            Watch how easy it is to manage your entire fitness business,
            automate payments, and track attendance from one centralized
            dashboard.
          </p>
        </div>

        {/* Video Container */}
        <div ref={videoRef} className="relative aspect-video w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(190,255,0,0.1)] group hover:shadow-[0_0_80px_rgba(190,255,0,0.05)] transition-shadow duration-700">
          {!isPlaying ? (
            <>
              {/* Lightweight Image Poster (avoids heavy unclicked YouTube iframe scripts) */}
              <div 
                className="absolute inset-0 bg-slate-950 flex items-center justify-center cursor-pointer group"
                onClick={() => setIsPlaying(true)}
              >
                <Image
                  src="https://img.youtube.com/vi/YNIIwl_qHPM/maxresdefault.jpg"
                  alt="GymFlow Video Walkthrough"
                  fill
                  className="object-cover opacity-80 group-hover:opacity-95 transition-opacity duration-300"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

                {/* Play Button Overlay */}
                <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary text-black flex items-center justify-center pl-1 group-hover:scale-110 transition-all duration-300 shadow-[0_0_40px_rgba(190,255,0,0.4)]">
                  <Play className="w-8 h-8 md:w-10 md:h-10 fill-black" />
                </div>
              </div>
            </>
          ) : (
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/YNIIwl_qHPM?si=mUcPHqbcLJBe_e_V&autoplay=1"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          )}
        </div>
      </div>
    </section>
  );
}
