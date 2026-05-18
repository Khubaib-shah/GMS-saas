"use client";

import { SectionHeading } from "./section-heading";
import { Play } from "lucide-react";
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

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "center center",
        scrub: 1,
      }
    });

    tl.fromTo(el, 
      { scale: 0.4, opacity: 0.5 },
      { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
    );

    return () => {
      tl.kill();
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
              {/* Thumbnail / Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/35 to-slate-800/35">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
                {/* We keep the iframe but without autoplay and pointer events so it acts as a thumbnail */}
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/YNIIwl_qHPM?si=mUcPHqbcLJBe_e_V&controls=0"
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  className="w-full h-full object-cover opacity-90 transition-transform duration-1000 ease-out pointer-events-none"
                ></iframe>
              </div>

              {/* Play Button Overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-auto z-10"
                onClick={() => setIsPlaying(true)}
              >
                <div className="w-24 h-24 rounded-full bg-primary/90 text-black flex items-center justify-center pl-2 group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-[0_0_40px_rgba(190,255,0,0.3)] backdrop-blur-sm">
                  <Play className="w-10 h-10 fill-black" />
                </div>
              </div>

              {/* Bottom Gradient for depth */}
              <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none"></div>
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
