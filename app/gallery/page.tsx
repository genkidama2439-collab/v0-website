import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { GalleryHero } from "@/components/gallery-hero"
import { ImageGallery } from "@/components/image-gallery"
import { Footer } from "@/components/footer"

export default function GalleryPage() {
  return (
    <div className="min-h-screen">
      <BubbleBackground />
      <Navbar />

      <main>
        <GalleryHero />
        <ImageGallery />
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
