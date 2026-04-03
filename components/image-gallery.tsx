"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Download, Heart, Share2, Eye, Trash2 } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

interface GalleryImage {
  src: string
  title: string
  category: string
  description: string
}

const initialGalleryImages: GalleryImage[] = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190430-kJtRINA4MIDkKCWZv2JYG4r8Y366iz.jpg",
    title: "海亀と一緒にシュノーケリング",
    category: "海亀体験",
    description:
      "透明度抜群の宮古島の海で、海亀と一緒に泳ぐ感動の瞬間。家族やカップルでの特別な体験をお楽しみください。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190431-Ww3py8Wm9ogBMFhp0seUzqRhdypk9O.jpg",
    title: "海亀との記念撮影",
    category: "記念写真",
    description: "美しい海中で海亀と一緒に撮影した記念写真。水面に映る光の模様が幻想的な雰囲気を演出します。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230720-P7200982-szA4D8aLpo1Ea14m2Z9wGj4JB5QIF5.jpg",
    title: "宮古島の海中世界",
    category: "海中風景",
    description: "水面上下を同時に捉えたスプリットショット。宮古島の美しい海岸線と透明な海中を一枚に収めた絶景写真。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190902-lVDNsaCVNCsCFPT4CGV0d5pY8ji4gO.jpg",
    title: "海亀との至近距離体験",
    category: "海亀体験",
    description:
      "海底で休息する海亀との貴重な出会い。間近で観察できる海亀の美しい甲羅の模様と穏やかな表情をお楽しみください。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230719-P7190285-3hIWBTJtJPkFyHx2i5V5hkEKdwOOw4.jpg",
    title: "カップルで海亀体験",
    category: "記念写真",
    description: "大切な人と一緒に海亀と泳ぐ特別な瞬間。水面に映る美しい光の反射が、ロマンチックな雰囲気を演出します。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230717-P7170313-7ShB5QROdk2pVrtQa5cA4HnX6D9qs4.jpg",
    title: "カラフルなサンゴ礁とクマノミ",
    category: "海中生物",
    description:
      "宮古島の豊かなサンゴ礁に住むオレンジ色のクマノミたち。多様な海洋生物が織りなす美しい海中の楽園をご覧ください。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230716-P7160026-2-xCLsoHvkrhlfCVXS4PSpECLPYQt3k3.jpg",
    title: "海亀と泳ぐ夫婦の記念写真",
    category: "記念写真",
    description:
      "水面からの美しい光に包まれながら、海亀と一緒に泳ぐご夫婦の感動的な瞬間。一生の思い出となる特別な体験です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7152056-xcHj0KyOIGTSiDrAZtgzoX87FtLw0i.jpg",
    title: "グループで海亀体験",
    category: "ファミリー",
    description:
      "家族や友人グループでの海亀シュノーケリング体験。水面に浮かびながら海亀と一緒に過ごす特別な時間をお楽しみください。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155003-vG2kkpVlckvEiOfvhxN4CUa57wWkuo.jpg",
    title: "3人で海亀観察",
    category: "ファミリー",
    description:
      "透明度抜群の海中で、3人一緒に海亀を観察する貴重な体験。海底の海草と一緒に撮影された美しい海中写真です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7152051-XKU6IhtQ1kFBajFNChMqu5PYvk01qw.jpg",
    title: "友達と海亀シュノーケリング",
    category: "記念写真",
    description: "友達同士で楽しむ海亀シュノーケリング。水面に映る美しい光の模様と一緒に撮影された感動的な瞬間です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7154995-Jp6QY7Raba0CudJdD3Ftr5lyOnpER8.jpg",
    title: "海亀との平和な時間",
    category: "海亀体験",
    description: "海底で休息する海亀と一緒に過ごす平和なひととき。海亀の自然な姿を間近で観察できる貴重な体験です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155093-CFKTIpWycIjirB47GqOhBzkjzfZXHq.jpg",
    title: "海亀との記念撮影",
    category: "記念写真",
    description: "海底で海亀と一緒に撮影した記念写真。海亀の美しい甲羅の模様と穏やかな表情が印象的な一枚です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155085-I4OqgwLMbl8nAVpZYTMexyuM4b3F4x.jpg",
    title: "海亀と一緒に泳ぐ体験",
    category: "海亀体験",
    description: "海亀と一緒に泳ぎながら撮影された動的な写真。海亀の優雅な泳ぎ姿を間近で体験できる感動の瞬間です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230715-P7155109-AV7aDudPGSeu1zNjrkELPolQilHONa.jpg",
    title: "海亀観察体験",
    category: "海亀体験",
    description:
      "海底で休息する海亀を観察する特別な体験。海亀の自然な行動を邪魔することなく、静かに観察する貴重な時間です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124427-eKTXAY68xDDfzfl326iBAdgNdm8gSq.jpg",
    title: "海亀との感動的な出会い",
    category: "海亀体験",
    description:
      "透明度抜群の海中で海亀と至近距離で出会う感動の瞬間。海亀の美しい表情と穏やかな眼差しが印象的な一枚です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7121543-ReS66RRi9OVaOzp3WKmy5XZbK5yJ58.jpg",
    title: "友達と海亀記念撮影",
    category: "記念写真",
    description:
      "友達同士でピースサインを作りながら海亀と一緒に撮影した楽しい記念写真。海底の美しい砂地も一緒に写っています。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124413-v9HLhTc2KQ4I5uYL0EZe52EW1O96jU.jpg",
    title: "海亀のクローズアップ",
    category: "海亀体験",
    description:
      "海亀の美しい甲羅の模様と優しい表情を間近で捉えた迫力のクローズアップ写真。海亀の魅力を存分に感じられます。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124428-SFFkwd5wZWHsGb0hXSwJwnoeAsV4YK.jpg",
    title: "海亀との共泳体験",
    category: "海亀体験",
    description: "複数の海亀と一緒に泳ぐ贅沢な体験。海亀の自然な泳ぎ姿を間近で観察できる特別な瞬間を捉えた写真です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124415-UYfQv7k6e5Hm6GkOsDHAXVcLLwEAaj.jpg",
    title: "海亀と記念撮影",
    category: "記念写真",
    description: "海亀が優雅に泳ぐ姿と一緒にピースサインで撮影した記念写真。海亀の動きの美しさが際立つ一枚です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7124452-ZfQhhaCOaswwNIocEdJj5JTfEfisQf.jpg",
    title: "海亀体験の喜び",
    category: "記念写真",
    description:
      "海亀との出会いに感動してサムズアップする瞬間。透明な海水と美しい光の中で撮影された感動的な記念写真です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/20230712-P7121544-9hBTBwX426xvuNHrPAHgcsDXqg8gLX.jpg",
    title: "カップルで海亀体験",
    category: "記念写真",
    description: "カップルで一緒に海亀と泳ぐロマンチックな体験。海底で休息する海亀と一緒に撮影した特別な記念写真です。",
  },
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/DSC06630.JPG-s6zKQo4DVkcMP4KFXSzSbTqVHYZyJy.jpeg",
    title: "プロフェッショナルなガイドサービス",
    category: "スタッフ",
    description:
      "経験豊富なガイドが安全で楽しいシュノーケリング体験をサポート。出発前の準備から丁寧にご案内いたします。",
  },
]

const categories = [
  "すべて",
  "海亀体験",
  "ファミリー",
  "VIP体験",
  "SUP",
  "上級者",
  "海中風景",
  "記念写真",
  "風景",
  "海中生物",
  "スタッフ",
]

export function ImageGallery() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialGalleryImages)
  const [selectedCategory, setSelectedCategory] = useState("すべて")
  const [lightboxImage, setLightboxImage] = useState<number | null>(null)
  const [liked, setLiked] = useState<Set<number>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [visibleCount, setVisibleCount] = useState(6) // 初期表示枚数を6枚に減らしてLCP向上
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const filteredImages =
    selectedCategory === "すべて" ? galleryImages : galleryImages.filter((img) => img.category === selectedCategory)

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredImages.length) {
          setVisibleCount((prev) => Math.min(prev + 6, filteredImages.length)) // 一度に6枚ずつ追加読み込みしてスムーズに
        }
      },
      { threshold: 0.1, rootMargin: "200px" }, // rootMarginを追加して読み込みタイミングを調整
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [visibleCount, filteredImages.length])

  useEffect(() => {
    setVisibleCount(6) // カテゴリ変更時は6枚から再スタート
  }, [selectedCategory])

  const openLightbox = (index: number) => {
    const actualIndex = galleryImages.findIndex((img) => img === filteredImages[index])
    setLightboxImage(actualIndex)
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const deleteCurrentImage = () => {
    if (lightboxImage !== null) {
      const newImages = galleryImages.filter((_, index) => index !== lightboxImage)
      setGalleryImages(newImages)

      const newLiked = new Set<number>()
      liked.forEach((index) => {
        if (index < lightboxImage) {
          newLiked.add(index)
        } else if (index > lightboxImage) {
          newLiked.add(index - 1)
        }
      })
      setLiked(newLiked)

      if (newImages.length === 0) {
        closeLightbox()
      } else if (lightboxImage >= newImages.length) {
        setLightboxImage(newImages.length - 1)
      }
    }
  }

  const nextImage = () => {
    if (lightboxImage !== null) {
      setLightboxImage((lightboxImage + 1) % galleryImages.length)
    }
  }

  const prevImage = () => {
    if (lightboxImage !== null) {
      setLightboxImage(lightboxImage === 0 ? galleryImages.length - 1 : lightboxImage - 1)
    }
  }

  const toggleLike = (index: number) => {
    const newLiked = new Set(liked)
    if (newLiked.has(index)) {
      newLiked.delete(index)
    } else {
      newLiked.add(index)
    }
    setLiked(newLiked)
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      scrollToIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < filteredImages.length - 1) {
      setCurrentIndex(currentIndex + 1)
      scrollToIndex(currentIndex + 1)
    }
  }

  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardWidth = container.clientWidth
      container.scrollTo({
        left: index * cardWidth,
        behavior: "smooth",
      })
    }
  }

  const visibleImages = filteredImages.slice(0, visibleCount)

  return (
    <section className="py-20 bg-gradient-to-b from-white/80 via-teal-50/30 to-emerald-50/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-emerald-800 mb-6 text-balance">
            感動の瞬間を
            <span className="block text-teal-600">ギャラリーで</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-pretty leading-relaxed">
            海亀兄弟での特別な体験の数々をご覧ください。透明度抜群の宮古島の海で撮影された、
            一生の思い出となる瞬間をお楽しみください。
          </p>
        </div>

        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category, categoryIndex) => (
              <Button
                key={`category-${categoryIndex}`}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(category)
                  setCurrentIndex(0)
                }}
                className={`rounded-full px-6 py-2 font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg scale-105"
                    : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 hover:scale-105"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {filteredImages.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gradient-to-br from-white/90 via-teal-50/80 to-emerald-50/90 backdrop-blur-xl rounded-3xl p-12 max-w-2xl mx-auto border border-emerald-100/50 shadow-xl">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4">ギャラリーは現在空です</h3>
              <p className="text-gray-600 text-lg">新しい写真が追加されるまでお待ちください。</p>
            </div>
          </div>
        ) : (
          <>
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {visibleImages.map((image, index) => (
                <div key={`image-${image.title}-${index}`} className="break-inside-avoid">
                  <Card
                    className="glass-card bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-emerald-100/50 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group relative will-change-transform"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="relative overflow-hidden">
                      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
                        <Image
                          src={image.src || "/placeholder.svg"}
                          alt={image.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-all duration-700 group-hover:scale-110"
                          placeholder="blur"
                          blurDataURL={BLUR_DATA_URLS.ocean}
                          quality={55} // ギャラリー画像を品質55、適切なsizesで最適化
                          loading="lazy" // lazy読み込みを追加
                        />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 will-change-opacity" />

                      <Badge className="absolute top-4 left-4 bg-emerald-600/90 backdrop-blur-sm text-white border-0 shadow-lg">
                        {image.category}
                      </Badge>

                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-2 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleLike(galleryImages.findIndex((img) => img === image))
                          }}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              liked.has(galleryImages.findIndex((img) => img === image))
                                ? "fill-red-500 text-red-500"
                                : "text-white"
                            }`}
                          />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-full p-2 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 will-change-transform">
                        <h3 className="font-bold text-xl mb-2 text-balance">{image.title}</h3>
                        <p className="text-sm text-gray-200 line-clamp-3 text-pretty leading-relaxed">
                          {image.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            {visibleCount < filteredImages.length && (
              <div ref={loadMoreRef} className="h-20 flex items-center justify-center mt-8">
                <div className="animate-pulse text-emerald-600 font-medium">読み込み中...</div>
              </div>
            )}
          </>
        )}

        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="前の画像"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={goToNext}
          disabled={currentIndex === filteredImages.length - 1}
          className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          aria-label="次の画像"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        <div className="flex justify-center items-center mt-6 md:hidden">
          <div className="flex gap-2">
            {filteredImages.map((_, index) => (
              <button
                key={`indicator-${index}`}
                onClick={() => {
                  setCurrentIndex(index)
                  scrollToIndex(index)
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentIndex === index ? "bg-emerald-600 w-8" : "bg-emerald-200 w-2 hover:bg-emerald-300"
                }`}
                aria-label={`画像 ${index + 1} に移動`}
              />
            ))}
          </div>
        </div>

        {lightboxImage !== null && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative max-w-5xl max-h-full">
              <Button
                size="sm"
                variant="ghost"
                className="absolute -top-16 right-0 text-white hover:bg-white/20 rounded-full p-3 shadow-lg backdrop-blur-sm"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
              </Button>

              {process.env.NODE_ENV === "development" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute -top-16 right-16 text-white hover:bg-red-500/20 rounded-full p-3 shadow-lg backdrop-blur-sm"
                  onClick={deleteCurrentImage}
                >
                  <Trash2 className="w-6 h-6" />
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-3 shadow-lg backdrop-blur-sm"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-3 shadow-lg backdrop-blur-sm"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>

              <div className="relative w-full max-w-5xl" style={{ aspectRatio: "16/10" }}>
                <Image
                  src={galleryImages[lightboxImage].src || "/placeholder.svg"}
                  alt={galleryImages[lightboxImage].title}
                  fill
                  sizes="100vw"
                  className="object-contain rounded-xl"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URLS.ocean}
                  quality={85} // ライトボックスは高品質85で表示
                  priority // priority付き
                />
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-8 text-white rounded-b-xl">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-emerald-600/90 backdrop-blur-sm text-white border-0 shadow-lg text-sm px-4 py-1">
                    {galleryImages[lightboxImage].category}
                  </Badge>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm"
                      onClick={() => toggleLike(lightboxImage)}
                    >
                      <Heart
                        className={`w-5 h-5 ${liked.has(lightboxImage) ? "fill-red-500 text-red-500" : "text-white"}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20 rounded-full p-2 backdrop-blur-sm"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-balance">{galleryImages[lightboxImage].title}</h3>
                <p className="text-gray-200 text-lg leading-relaxed text-pretty">
                  {galleryImages[lightboxImage].description}
                </p>
                <div className="text-sm text-gray-400 mt-4 font-medium">
                  {lightboxImage + 1} / {galleryImages.length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-br from-white/90 via-teal-50/80 to-emerald-50/90 backdrop-blur-xl rounded-3xl p-12 max-w-3xl mx-auto border border-emerald-100/50 shadow-xl">
            <h3 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-6 text-balance">あなたも感動体験を</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto text-pretty leading-relaxed">
              ギャラリーの写真のような素晴らしい体験があなたを待っています。
              透明度抜群の宮古島の海で、一生の思い出を作りませんか？
            </p>
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <a href="/book">今すぐ予約する</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
