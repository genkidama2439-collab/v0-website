import { LocalBusinessJsonLd } from "@/components/json-ld"
import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { StatsSection } from "@/components/home/stats-section"
import { ExperienceSection } from "@/components/home/experience-section"
import { TurtleGuideSection } from "@/components/home/turtle-guide-section"
import { PlansSection } from "@/components/home/plans-section"
import { GallerySection } from "@/components/home/gallery-section"
import { StaffSection } from "@/components/home/staff-section"
import { FAQSection } from "@/components/home/faq-section"
import { CTASection } from "@/components/home/cta-section"

export default function Page() {
  return (
    <div className="min-h-screen-ios main-container ios-scroll-fix">
      <LocalBusinessJsonLd />
      <Navbar />

      <main>
        {/* ① 第一印象・予約判断 */}
        <HeroSection />

        {/* ② プラン比較 */}
        <PlansSection />

        {/* ③ 口コミ以外の実績 */}
        <StatsSection />

        {/* ④ 選ばれる理由 */}
        <FeaturesSection />

        {/* ⑤ 体験ビジュアル */}
        <ExperienceSection />

        {/* ⑤.5 ウミガメガイド（/miyakojima-sea-turtle）への導線 */}
        <TurtleGuideSection />

        {/* ⑥ 撮影ギャラリー */}
        <GallerySection />

        {/* ⑧ スタッフ紹介 */}
        <StaffSection />

        {/* ⑨ よくある質問 */}
        <FAQSection />

        {/* ⑩ 最終CTA */}
        <CTASection />
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
