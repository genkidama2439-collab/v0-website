import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { StaffHero } from "@/components/staff-hero"
import { StaffGrid } from "@/components/staff-grid"
import { Footer } from "@/components/footer"

export default function StaffPage() {
  return (
    <div className="min-h-screen">
      <BubbleBackground />
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
