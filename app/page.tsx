import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { SocialProof } from "@/components/landing/social-proof"
import { ProblemSection } from "@/components/landing/problem-section"
import { SolutionSection } from "@/components/landing/solution-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CoreFeatures } from "@/components/landing/core-features"
import { RoleSystem } from "@/components/landing/role-system"
import { ProductShowcase } from "@/components/landing/product-showcase"
import { PricingSection } from "@/components/landing/pricing-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { VideoShowcase } from "@/components/landing/video-showcase"
import { Testimonials } from "@/components/landing/testimonials"
import { RequestDemo } from "@/components/landing/request-demo";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-primary selection:text-black font-sans overflow-x-hidden">
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
    </div>
  )
}
