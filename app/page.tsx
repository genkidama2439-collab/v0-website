import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { TrustRibbon } from "@/components/trust-ribbon"
import { PopularPlans } from "@/components/popular-plans"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"

export default function Page() {
  return (
    <div className="min-h-screen-ios main-container ios-scroll-fix">
      <BubbleBackground />
      <Navbar />

      <main>
        <HeroSection />
        <TrustRibbon />
        <PopularPlans />
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
