import Image from "next/image"
import { Star } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

export function HeroSection() {
  return (
    <section className="relative min-h-[100svh] flex flex-col overflow-hidden">
      {/* Full-screen background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/gemini-generated-image-rq969urq969urq96.jpeg"
          alt="宮古島の海亀兄弟 - 2匹のウミガメが一緒に泳ぐ様子"
          fill
          priority
          fetchPriority="high"
          quality={90}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.turtle}
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Rating badge */}
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 mb-6 shadow-lg">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-gray-800 font-bold">4.9</span>
            <span className="text-gray-500 text-sm">/ 10,136件の口コミ</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
            海亀兄弟
          </h1>

          {/* Subheading */}
          <p className="text-2xl sm:text-3xl md:text-4xl text-white font-medium mb-3 drop-shadow-lg">
            宮古島でウミガメと泳ごう
          </p>

          {/* Description */}
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            初心者・お子様大歓迎。感動の海亀体験をお届けします。
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-3 text-white/90 text-sm font-medium">
            <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">器材レンタル無料</span>
            <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">写真データ無料</span>
            <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">保険加入済み</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <div className="w-8 h-12 rounded-full border-2 border-white/50 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
