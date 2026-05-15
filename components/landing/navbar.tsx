"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-6 h-12 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/logo/left&right.png"
            alt="GymFlow Logo"
            width={200}
            height={50}
            className="h-10 md:h-20 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link-reveal text-[13px] md:text-[18px]">
              <div className="nav-text">
                {l.label.split(" ").map((w, i) => <span key={i}>{w}</span>)}
              </div>
              <div className="nav-clone">
                {l.label.split(" ").map((w, i) => <span key={i}>{w}</span>)}
              </div>
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <button className="btn-text-reveal">
              <div className="btn-text">
                <span>Sign</span>
                <span>in</span>
              </div>
              <div className="btn-clone">
                <span>Sign</span>
                <span>in</span>
              </div>
              <svg strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </button>
          </Link>
          <Link href="/signup">
            <button className="btn-nav-secondary">
              <span>Get started</span>
            </button>
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
              <button className="btn-nav-secondary w-full">
                <span>Get started</span>
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
