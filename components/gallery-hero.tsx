import Image from "next/image"
import { Camera, ImageIcon, Heart } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

export function GalleryHero() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with overlay */}
      <Image
        src="/images/design-mode/DSC02966.JPG.jpeg"
        alt="ギャラリー背景"
        fill
        loading="lazy"
        quality={70}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URLS.ocean}
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-teal-900/40 to-cyan-900/60 z-[1]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="floating">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">ギャラリー</h1>
          <p className="text-xl md:text-2xl text-cyan-100 mb-8 max-w-2xl mx-auto text-pretty">
            海亀兄弟での感動的な瞬間をご覧ください。
            <br />
            透明度抜群の海と海亀との出会いの記録。
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <Camera className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">99%</div>
              <div className="text-cyan-100 text-sm">遭遇率</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <ImageIcon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">高画質</div>
              <div className="text-cyan-100 text-sm">水中撮影</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">感動体験</div>
              <div className="text-cyan-100 text-sm">お客様の笑顔</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
