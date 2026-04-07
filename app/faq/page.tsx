import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "よくある質問",
  description: "海亀兄弟のツアーに関するよくある質問。泳ぎが苦手でも参加できる？何歳から？持ち物は？雨の日は？など、お客様の疑問にお答えします。",
  alternates: { canonical: "https://www.umigamekyoudaimiyakojima.com/faq" },
}
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { FAQHero } from "@/components/faq-hero"
import { FAQSection } from "@/components/faq-section"
import { FAQJsonLd } from "@/components/json-ld"
import { FAQS } from "@/lib/data"
import { Footer } from "@/components/footer"

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <FAQJsonLd faqs={FAQS} />
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
