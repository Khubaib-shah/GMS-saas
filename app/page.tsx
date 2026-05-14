import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { SocialProof } from "@/components/landing/social-proof"
import dynamic from "next/dynamic"

import { PreLoader } from "@/components/pre-loader"
import { GlobalAntigravity } from "@/components/global-antigravity"
import SmoothScroller from "@/components/smooth-scroller"

// Lazy load below-the-fold components
const VideoShowcase = dynamic(() => import("@/components/landing/video-showcase").then(mod => mod.VideoShowcase))
const ProblemSection = dynamic(() => import("@/components/landing/problem-section").then(mod => mod.ProblemSection))
const SolutionSection = dynamic(() => import("@/components/landing/solution-section").then(mod => mod.SolutionSection))
const HowItWorks = dynamic(() => import("@/components/landing/how-it-works").then(mod => mod.HowItWorks))
const CoreFeatures = dynamic(() => import("@/components/landing/core-features").then(mod => mod.CoreFeatures))
const RoleSystem = dynamic(() => import("@/components/landing/role-system").then(mod => mod.RoleSystem))
const ProductShowcase = dynamic(() => import("@/components/landing/product-showcase").then(mod => mod.ProductShowcase))
const PricingSection = dynamic(() => import("@/components/landing/pricing-section").then(mod => mod.PricingSection))
const Testimonials = dynamic(() => import("@/components/landing/testimonials").then(mod => mod.Testimonials))
const CTASection = dynamic(() => import("@/components/landing/cta-section").then(mod => mod.CTASection))
const RequestDemo = dynamic(() => import("@/components/landing/request-demo").then(mod => mod.RequestDemo))
const Footer = dynamic(() => import("@/components/landing/footer").then(mod => mod.Footer))
const BackToTop = dynamic(() => import("@/components/landing/back-to-top").then(mod => mod.BackToTop))

export default function LandingPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-white selection:bg-primary selection:text-black font-sans overflow-clip">
      <PreLoader />
      {/* <GlobalAntigravity /> */}
      <SmoothScroller />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <VideoShowcase />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <CoreFeatures />
        <RoleSystem />
        <ProductShowcase />
        <PricingSection />
        <Testimonials />
        <CTASection />
        <RequestDemo />
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
