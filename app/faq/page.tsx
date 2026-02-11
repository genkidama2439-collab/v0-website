import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { FAQHero } from "@/components/faq-hero"
import { FAQSection } from "@/components/faq-section"
import { Footer } from "@/components/footer"

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <BubbleBackground />
      <Navbar />

      <main>
        <FAQHero />
        <FAQSection />
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
