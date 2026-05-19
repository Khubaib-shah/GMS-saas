"use client"

import { SectionHeading } from "./section-heading"
import { Star } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useRef, useState } from "react"

const testimonials = [
  {
    quote: "We used to lose 15–20 members every month who were training with expired plans. GymFlow stopped that on day one. Revenue went up 22% in the first month.",
    name: "Ahmed Raza Khan",
    role: "Owner, Iron Forge Gym — Karachi",
    highlight: "+22% revenue in month one",
    initial: "A",
  },
  {
    quote: "My receptionist used to spend 20 minutes every morning checking the register. Now she just scans QR codes. The whole check-in takes 2 seconds.",
    name: "Sadia Malik",
    role: "Manager, FitZone Studios — Lahore",
    highlight: "Hours saved every week",
    initial: "S",
  },
  {
    quote: "The POS module alone saved us. We were tracking supplement sales in a notebook. Now everything is digital and I can see exactly how much product revenue we make.",
    name: "Hamza Sheikh",
    role: "Owner, Titan Strength — Islamabad",
    highlight: "Full product revenue visibility",
    initial: "H",
  },
  {
    quote: "We manage 3 branches and GymFlow is the only tool that lets us see everything in one place. The multi-branch reports are incredibly useful.",
    name: "Hassan Ali",
    role: "CEO, PowerFit Chain — Rawalpindi",
    highlight: "3 branches, one dashboard",
    initial: "H",
  },
  {
    quote: "Switching from spreadsheets to GymFlow was the best decision we made. Member retention improved because we now reach out before subscriptions expire.",
    name: "Sara Mahmood",
    role: "Operations Lead, Zenith Gym — Faisalabad",
    highlight: "Better member retention",
    initial: "S",
  },
  {
    quote: "The role-based access is perfect. My receptionist only sees what she needs, trainers manage clients, and I get the full financial picture.",
    name: "Usman Tariq",
    role: "Founder, Elite Training Center — Peshawar",
    highlight: "Perfect permissions control",
    initial: "U",
  },
]

export function Testimonials() {
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current as any])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on("select", onSelect)
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi, onSelect])

  return (
    <section id="testimonials" className="py-16 md:py-32 px-4 md:px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-10 md:mb-16">
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-4">Testimonials</div>
          <SectionHeading
            title="Trusted by gym owners across Pakistan"
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] md:text-[17px] text-white/70 leading-relaxed max-w-xl">
            Real quotes from gym owners who switched to GymFlow.
          </p>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 py-2">
            {testimonials.map((t, i) => (
              <div key={i} className="flex-[0_0_100%] sm:flex-[0_0_calc(50%-8px)] lg:flex-[0_0_calc(33.333%-11px)] min-w-0">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 md:p-6 flex flex-col gap-5 h-full hover:border-white/[0.10] transition-colors">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />
                    ))}
                  </div>

                  {/* Highlight */}
                  <div className="inline-block text-[10px] font-semibold uppercase tracking-widest text-primary border border-primary/20 bg-primary/[0.06] rounded-full px-2.5 py-1 w-fit">
                    {t.highlight}
                  </div>

                  {/* Quote */}
                  <p className="text-[13px] text-white/60 leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                    <div className="w-8 h-8 rounded-full bg-primary/[0.08] border border-primary/[0.15] flex items-center justify-center text-[12px] font-bold text-primary shrink-0">
                      {t.initial}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{t.name}</div>
                      <div className="text-[11px] text-white/30">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1 rounded-full transition-all duration-300 ${i === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
