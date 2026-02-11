import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { TrustRibbon } from "@/components/trust-ribbon"
import { PopularPlans } from "@/components/popular-plans"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"

export default function Page() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "海亀兄弟",
    image: "https://miyakojima.vercel.app/images/hero-aerial-ocean.jpg",
    telephone: "08053442439",
    email: "umigamekyoudai@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "平良西里861-5",
      addressLocality: "宮古島市",
      addressRegion: "沖縄県",
      postalCode: "906-0012",
      addressCountry: "JP",
    },
    priceRange: "¥6,000 - ¥85,000",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "18:00",
    },
  }

  return (
    <div className="min-h-screen-ios main-container ios-scroll-fix">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
