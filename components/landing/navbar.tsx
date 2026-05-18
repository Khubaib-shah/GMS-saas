"use client"

import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

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

      {/* Mobile menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { delay: 0.2, duration: 0.4 } }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ clipPath: "circle(0px at calc(100% - 40px) 40px)", scale: 0, opacity: 0 }}
              animate={{ clipPath: "circle(1500px at calc(100% - 40px) 40px)", scale: 1, opacity: 1 }}
              exit={{ clipPath: "circle(0px at calc(100% - 40px) 40px)", scale: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: "anticipate" }}
              style={{ transformOrigin: "calc(100% - 40px) 40px" }}
              className="relative w-full h-full glass-premium rounded-none bg-[#0a0a0a]/95  overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header inside menu */}
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black tracking-widest uppercase text-white">GymFlow</span>
                  <span className="text-[9px] text-primary uppercase tracking-[0.2em] font-black">Control Panel</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="flex-1 px-8 py-10 flex flex-col justify-center gap-6 overflow-y-auto custom-scrollbar">
                {navLinks.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setIsOpen(false)}
                      className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white hover:text-primary transition-colors block"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Footer Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: 0.6 }}
                className="p-6 border-t border-white/[0.06] bg-black/20"
              >
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/[0.06] uppercase tracking-widest text-[12px] font-bold">
                      Sign in to Dashboard
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <button className="btn-nav-secondary w-full h-14 rounded-2xl">
                      <span className="uppercase tracking-wider text-[13px]">Start Free Trial</span>
                    </button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
