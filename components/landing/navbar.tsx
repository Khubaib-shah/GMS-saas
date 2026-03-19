import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <header className="px-6 h-20 flex items-center justify-between sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(190,255,0,0.2)] group-hover:scale-105 transition-transform">
          <BarChart3 className="w-6 h-6 text-black" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">Gym<span className="text-primary">Flow</span></span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost" className="text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5">
            Log in
          </Button>
        </Link>
        <Link href="#request-demo">
          <Button className="bg-primary text-black hover:bg-primary/90 font-semibold rounded-lg px-6 transition-all hidden sm:flex">
            Request Demo
          </Button>
        </Link>
      </div>
    </header>
  )
}
