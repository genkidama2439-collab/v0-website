"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

interface GalleryImage {
  src: string
  title: string
  category: string
}

const galleryImages: GalleryImage[] = [
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190430-kJtRINA4MIDkKCWZv2JYG4r8Y366iz.jpg", title: "海亀と一緒にシュノーケリング", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190431-Ww3py8Wm9ogBMFhp0seUzqRhdypk9O.jpg", title: "海亀との記念撮影", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230720-P7200982-szA4D8aLpo1Ea14m2Z9wGj4JB5QIF5.jpg", title: "宮古島の海中世界", category: "海中風景" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190902-lVDNsaCVNCsCFPT4CGV0d5pY8ji4gO.jpg", title: "海亀との至近距離体験", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190285-3hIWBTJtJPkFyHx2i5V5hkEKdwOOw4.jpg", title: "カップルで海亀体験", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230717-P7170313-7ShB5QROdk2pVrtQa5cA4HnX6D9qs4.jpg", title: "クマノミとサンゴ礁", category: "海中生物" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230716-P7160026-2-xCLsoHvkrhlfCVXS4PSpECLPYQt3k3.jpg", title: "海亀と泳ぐ夫婦", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7152056-xcHj0KyOIGTSiDrAZtgzoX87FtLw0i.jpg", title: "グループで海亀体験", category: "ファミリー" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155003-vG2kkpVlckvEiOfvhxN4CUa57wWkuo.jpg", title: "3人で海亀観察", category: "ファミリー" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7152051-XKU6IhtQ1kFBajFNChMqu5PYvk01qw.jpg", title: "友達と海亀シュノーケリング", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7154995-Jp6QY7Raba0CudJdD3Ftr5lyOnpER8.jpg", title: "海亀との平和な時間", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155093-CFKTIpWycIjirB47GqOhBzkjzfZXHq.jpg", title: "海亀との記念撮影", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155085-I4OqgwLMbl8nAVpZYTMexyuM4b3F4x.jpg", title: "海亀と一緒に泳ぐ", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155109-AV7aDudPGSeu1zNjrkELPolQilHONa.jpg", title: "海亀観察体験", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124427-eKTXAY68xDDfzfl326iBAdgNdm8gSq.jpg", title: "海亀との感動的な出会い", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7121543-ReS66RRi9OVaOzp3WKmy5XZbK5yJ58.jpg", title: "友達と海亀記念撮影", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124413-v9HLhTc2KQ4I5uYL0EZe52EW1O96jU.jpg", title: "海亀のクローズアップ", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124428-SFFkwd5wZWHsGb0hXSwJwnoeAsV4YK.jpg", title: "海亀との共泳体験", category: "海亀体験" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124415-UYfQv7k6e5Hm6GkOsDHAXVcLLwEAaj.jpg", title: "海亀と記念撮影", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124452-ZfQhhaCOaswwNIocEdJj5JTfEfisQf.jpg", title: "海亀体験の喜び", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7121544-9hBTBwX426xvuNHrPAHgcsDXqg8gLX.jpg", title: "カップルで海亀体験", category: "記念写真" },
  { src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC06630.JPG-s6zKQo4DVkcMP4KFXSzSbTqVHYZyJy.jpeg", title: "ガイドサービス", category: "スタッフ" },
  { src: "/images/night-tour-coconut-crab.jpg", title: "ヤシガニとガイド", category: "ナイトツアー" },
  { src: "/images/gallery-new-1.jpg", title: "巨大ヤシガニ", category: "ナイトツアー" },
]

const categories = ["すべて", "海亀体験", "記念写真", "ファミリー", "海中風景", "海中生物", "ナイトツアー", "スタッフ"]

// --- Lightbox ---
function Lightbox({ images, index, onClose, onPrev, onNext }: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const img = images[index]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrev()
      if (e.key === "ArrowRight") onNext()
    }
    window.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [onClose, onPrev, onNext])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 relative z-10" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-white/60 text-xs">{index + 1} / {images.length}</p>
          <p className="text-white text-sm font-semibold">{img.title}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 relative flex items-center justify-center px-2 sm:px-12" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full h-full max-w-5xl">
          <Image
            src={img.src}
            alt={img.title}
            fill
            className="object-contain"
            sizes="100vw"
            quality={90}
            priority
          />
        </div>

        {/* Nav arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 transition-all"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div className="p-3 sm:p-4 relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide justify-center">
          {images.map((thumb, i) => (
            <button
              key={i}
              onClick={() => { /* navigate to index */ }}
              className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden transition-all ${
                i === index ? "ring-2 ring-emerald-400 opacity-100" : "opacity-40 hover:opacity-70"
              }`}
            >
              <Image src={thumb.src} alt="" fill className="object-cover" sizes="56px" quality={30} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function ImageGallery() {
  const [selectedCategory, setSelectedCategory] = useState("すべて")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [visibleCount, setVisibleCount] = useState(9)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filteredImages = selectedCategory === "すべて"
    ? galleryImages
    : galleryImages.filter((img) => img.category === selectedCategory)

  const visibleImages = filteredImages.slice(0, visibleCount)

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredImages.length) {
          setVisibleCount((prev) => Math.min(prev + 9, filteredImages.length))
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [visibleCount, filteredImages.length])

  useEffect(() => {
    setVisibleCount(9)
  }, [selectedCategory])

  const openLightbox = (filteredIndex: number) => {
    setLightboxIndex(filteredIndex)
  }

  return (
    <section className="py-8 sm:py-12 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category filters */}
        <div className="mb-6 sm:mb-10 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap sm:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-gray-400 mb-4">{filteredImages.length}枚の写真</p>

        {/* Grid */}
        <div className="columns-2 sm:columns-2 md:columns-3 gap-2 sm:gap-3 space-y-2 sm:space-y-3">
          {visibleImages.map((image, index) => (
            <motion.div
              key={image.src}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
              className="break-inside-avoid cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <div className="relative overflow-hidden rounded-lg sm:rounded-xl">
                <div className="relative w-full" style={{ aspectRatio: index % 3 === 0 ? "3/4" : "4/3" }}>
                  <Image
                    src={image.src}
                    alt={image.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URLS.ocean}
                    quality={60}
                    loading="lazy"
                  />
                  {/* Hover/tap overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <div className="w-full p-2.5 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <span className="text-white text-[10px] sm:text-xs font-medium bg-emerald-500/80 px-2 py-0.5 rounded-full">
                        {image.category}
                      </span>
                      <p className="text-white text-xs sm:text-sm font-semibold mt-1 line-clamp-1">{image.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load more trigger */}
        {visibleCount < filteredImages.length && (
          <div ref={loadMoreRef} className="h-16 flex items-center justify-center mt-6">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-emerald-400"
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-20 text-center"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-3xl font-bold text-white mb-3">あなたも感動体験を</h3>
            <p className="text-emerald-100 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              ギャラリーの写真のような素晴らしい体験があなたを待っています。写真は全て無料でプレゼント。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/book"
                className="bg-white text-emerald-700 font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-xl transition-all active:scale-95 hover:bg-emerald-50"
              >
                今すぐ予約する
              </Link>
              <a
                href="https://lin.ee/jfp4laz"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full border border-white/30 transition-all active:scale-95"
              >
                LINEで相談
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={filteredImages}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() => setLightboxIndex((lightboxIndex - 1 + filteredImages.length) % filteredImages.length)}
            onNext={() => setLightboxIndex((lightboxIndex + 1) % filteredImages.length)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
