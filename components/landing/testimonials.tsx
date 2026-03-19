"use client"

import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { useCallback, useEffect, useRef, useState } from "react"

const testimonials = [
  {
    quote: "GymFlow completely transformed how we run our fitness studio. We went from chasing payments manually to having everything automated. Our revenue increased by 30% in just 3 months.",
    name: "Ahmed Khan",
    role: "Owner, Iron Body Fitness",
    rating: 5,
    highlight: "Revenue increased by 30%",
    image: "/assets/testimonial/person1.jpg"
  },
  {
    quote: "The attendance tracking alone saved us hours every week. Our trainers love the mobile experience, and our members appreciate the self-service portal. It's a win-win.",
    name: "Fatima Riaz",
    role: "Manager, FitZone Studios",
    rating: 5,
    highlight: "Hours saved every week",
    image: "/assets/testimonial/person2.jpg"
  },
  {
    quote: "We manage 4 branches across the city, and GymFlow is the only tool that lets us see everything in one place. The multi-branch analytics are incredibly powerful.",
    name: "Hassan Ali",
    role: "CEO, PowerFit Chain",
    rating: 5,
    highlight: "4 branches, one dashboard",
    image: "/assets/testimonial/person3.jpg"
  },
  {
    quote: "Switching from spreadsheets to GymFlow was the best decision we made. Member retention went up because we can now proactively reach out before subscriptions expire.",
    name: "Sara Mahmood",
    role: "Operations Lead, Zenith Gym",
    rating: 5,
    highlight: "Member retention improved",
    image: "/assets/testimonial/person4.jpg"
  },
  {
    quote: "The role-based access is perfect. My receptionist only sees what she needs, trainers manage their clients, and I get the full financial picture. No more permission headaches.",
    name: "Usman Tariq",
    role: "Founder, Elite Training Center",
    rating: 5,
    highlight: "Perfect role management",
    image: "/assets/testimonial/person5.jpg"
  },
  {
    quote: "I was skeptical about SaaS tools, but the onboarding was seamless. The demo call answered all my questions, and we were fully running within a week.",
    name: "Ayesha Nawaz",
    role: "Owner, SheFit Studio",
    rating: 5,
    highlight: "Up and running in a week",
    image: "/assets/testimonial/person6.jpg"
  },
]

export function Testimonials() {
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", slidesToScroll: 1 },
    [autoplayPlugin.current]
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

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
    <section className="py-28 px-6 bg-slate-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-widest uppercase">
            Testimonials
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Loved by gym owners <br className="hidden md:block" /> everywhere.
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Don&apos;t just take our word for it. Here&apos;s what our customers have to say about GymFlow.
          </p>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden px-1" ref={emblaRef}>
          <div className="flex gap-8 -ml-1 py-6">
            {testimonials.map((t, i) => (

              <div
                key={i}
                className={`${i === testimonials.length - 1 ? "mr-8" : ""} flex-[0_0_100%] min-w-0 sm:flex-[0_0_calc(50%-16px)] lg:flex-[0_0_calc(33.333%-22px)] pl-0`}
              >
                <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 h-full flex flex-col hover:-translate-y-1 transition-transform duration-500">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                    ))}
                  </div>

                  {/* Highlight Badge */}
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold mb-4 tracking-wider uppercase w-fit">
                    {t.highlight}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-300 text-sm leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="text-white font-semibold text-sm">{t.name}</div>
                      <div className="text-slate-500 text-xs">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation: Arrows + Dots */}
        <div className="flex items-center justify-center gap-6 mt-10">
          <button
            onClick={scrollPrev}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {scrollSnaps.map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedIndex
                  ? "bg-primary w-6"
                  : "bg-white/20 hover:bg-white/40"
                  }`}
                onClick={() => emblaApi && emblaApi.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={scrollNext}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
