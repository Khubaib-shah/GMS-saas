import Link from "next/link"
import { Zap } from "lucide-react"

const cols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#c6ff00] flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[15px] text-white tracking-tight">
                Gym<span className="text-[#c6ff00]">Flow</span>
              </span>
            </Link>
            <p className="text-[13px] text-white/30 leading-relaxed max-w-[220px]">
              The all-in-one gym management platform. Built for gym owners who want to grow.
            </p>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-5">{col.title}</h4>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[13px] text-white/40 hover:text-white transition-colors duration-200">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-white/[0.06]">
          <span className="text-[12px] text-white/20">
            © {new Date().getFullYear()} GymFlow. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#c6ff00] animate-pulse" />
              <span className="text-[11px] text-white/20">All systems operational</span>
            </div>
            <span className="text-[12px] text-white/20">Made in Pakistan 🇵🇰</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
