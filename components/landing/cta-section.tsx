import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-24 px-6 relative flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto relative z-10 p-10 md:p-24 rounded-3xl text-center flex flex-col items-center">

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
          Ready to Simplify Your <br className="hidden sm:block" /> Gym Operations?
        </h2>

        <p className="text-base md:text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Book a demo and see how GymFlow can transform your gym. Stop struggling with spreadsheets and switch to a modern management system.
        </p>

        <Link href="#request-demo">
          <Button size="lg" className="h-12 px-8 text-base font-semibold rounded-full bg-primary text-black hover:bg-primary/90 transition-all w-full sm:w-auto hover:scale-105 active:scale-95 group">
            Request Demo
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
