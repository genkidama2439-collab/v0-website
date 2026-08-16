import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { createMetadata } from "@/lib/seo"

export const metadata: Metadata = createMetadata({
  title: "よくある質問",
  description: "海亀兄弟のツアーに関するよくある質問。泳ぎが苦手でも参加できる？何歳から？持ち物は？雨の日は？など、お客様の疑問にお答えします。",
  path: "/faq",
  locale: "ja",
  intlBasePath: "/faq",
  image: "/faq-ocean-hero.jpg",
})
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { FAQHero } from "@/components/faq-hero"
import { FAQSection } from "@/components/faq-section"
import { FAQJsonLd } from "@/components/json-ld"
import { getFaqs } from "@/lib/faq"
import { Footer } from "@/components/footer"

export default function FAQPage() {
  // 表示とFAQPage構造化データは必ず同じ配列を使う
  const faqs = getFaqs("faq-page")

  return (
    <div className="min-h-screen">
      <FAQJsonLd faqs={faqs} />
      <BubbleBackground />
      <Navbar />

      <main>
        <FAQHero />
        <FAQSection faqs={faqs} />

        {/* 予約前の2大不安（安全・集合場所）はまとめページへ誘導 */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/safety"
              className="block rounded-2xl bg-white border border-emerald-100 shadow-sm p-5 hover:border-emerald-300 transition-colors"
            >
              <h2 className="font-bold text-gray-900 mb-1">安全への取り組み →</h2>
              <p className="text-sm text-gray-600">ライフジャケット・浅瀬エントリー・中止基準・参加条件をまとめて確認</p>
            </Link>
            <Link
              href="/access"
              className="block rounded-2xl bg-white border border-cyan-100 shadow-sm p-5 hover:border-cyan-300 transition-colors"
            >
              <h2 className="font-bold text-gray-900 mb-1">集合場所・アクセス →</h2>
              <p className="text-sm text-gray-600">前日案内の理由と、各ビーチの駐車場・トイレ・シャワー設備</p>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
