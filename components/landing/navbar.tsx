"use client"

import Link from "next/link"
import { Zap, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Reviews" },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-black/90 backdrop-blur-md border-b border-white/[0.06]" : "bg-transparent"}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#c6ff00] flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-[15px] tracking-tight text-white">
            Gym<span className="text-[#c6ff00]">Flow</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-[13px] text-white/50 hover:text-white transition-colors duration-200">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="h-8 px-4 text-[13px] text-white/60 hover:text-white hover:bg-white/[0.06] rounded-md">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="h-8 px-4 text-[13px] font-semibold bg-[#c6ff00] text-black hover:bg-[#d4ff33] rounded-md transition-colors">
              Get started
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-white/60 hover:text-white">
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-black/95 backdrop-blur-md px-6 py-6 flex flex-col gap-5">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setIsOpen(false)} className="text-[15px] text-white/60 hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-white/[0.06]">
            <Link href="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/[0.06]">Sign in</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-[#c6ff00] text-black hover:bg-[#d4ff33] font-semibold">Get started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
