"use client"

import Link from "next/link"
import { BarChart3, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

const navLinks = [
  { href: "#solution", label: "Solution" },
  { href: "#features", label: "Features" },
  { href: "#product", label: "Product" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how-it-works", label: "How it Works" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="px-6 h-20 flex items-center justify-between sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
      <Link href="/" className="flex items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(190,255,0,0.2)] group-hover:scale-105 transition-transform">
          <BarChart3 className="w-6 h-6 text-black" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">Gym<span className="text-primary">Flow</span></span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-400">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden sm:block">
          <Button variant="ghost" className="text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5">
            Log in
          </Button>
        </Link>
        <Link href="#request-demo" className="hidden sm:block">
          <Button className="bg-primary text-black hover:bg-primary/90 font-semibold rounded-lg px-6 transition-all">
            Request Demo
          </Button>
        </Link>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-950 border-white/10 text-white">
              <SheetHeader>
                <SheetTitle className="text-white flex items-center gap-2">
                   <BarChart3 className="w-6 h-6 text-primary" />
                   <span>Gym<span className="text-primary">Flow</span></span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-12">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="text-lg font-medium text-slate-400 hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-white/10">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                      Log in
                    </Button>
                  </Link>
                  <Link href="#request-demo" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-primary text-black hover:bg-primary/90 font-semibold">
                      Request Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
