import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "スタッフ紹介",
  description: "海亀兄弟のスタッフをご紹介。宮古島の海を知り尽くした経験豊富なガイドが、安全で楽しい体験をお届けします。",
  alternates: { canonical: "https://www.umigamekyoudaimiyakojima.com/staff" },
}
import { MobileCTA } from "@/components/mobile-cta"
import { StaffHero } from "@/components/staff-hero"
import { StaffGrid } from "@/components/staff-grid"
import { Footer } from "@/components/footer"

export default function StaffPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <StaffHero />
        <StaffGrid />
      </main>
      <Footer />
      <MobileCTA />
    </div>
  )
}
