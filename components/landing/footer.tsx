import Link from "next/link"
import { BarChart3, Twitter, Linkedin, Instagram, Facebook } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-20 px-6 bg-slate-950 border-t border-white/5 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Gym<span className="text-primary">Flow</span></span>
          </div>
          <p className="text-sm leading-relaxed mb-6">
            Professional gym management software for high-efficiency fitness centers. Built to automate, optimize, and scale your business.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-black hover:border-primary transition-all">
              <Facebook className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Product</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
            <li><Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            <li><Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Company</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Legal</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs gap-4">
        <div>© {new Date().getFullYear()} GymFlow Management Systems. All rights reserved.</div>
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Systems Operational</span>
        </div>
      </div>
    </footer>
  )
}
