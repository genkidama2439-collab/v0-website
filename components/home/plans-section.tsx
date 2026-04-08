"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Star, Clock, Users, Camera, Shield, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

interface PlanVariant {
  id: string
  label: string
  price: string
  priceNote: string
  highlights: string[]
  included: string[]
}

interface Tour {
  name: string
  tagline: string
  description: string
  image: string
  duration: string
  age: string
  rating: number
  reviews: number
  badge: string
  badgeColor: string
  variants: PlanVariant[]
}

const tours: Tour[] = [
  {
    name: "ウミガメシュノーケルツアー",
    tagline: "安全管理徹底！少人数制で安心の感動体験",
    description: "宮古島の透き通る海で、ウミガメと一緒に泳ぐ感動体験。安全管理を徹底した少人数制だからお子様も安心。高画質の写真・動画は全て無料プレゼント。",
    image: "/images/s1-sea-turtle-snorkeling.jpg",
    duration: "約2時間",
    age: "5〜65歳",
    rating: 4.9,
    reviews: 5089,
    badge: "一番人気",
    badgeColor: "bg-yellow-400 text-yellow-900",
    variants: [
      {
        id: "S1",
        label: "通常プラン",
        price: "¥6,500",
        priceNote: "子供¥6,000",
        highlights: ["安全管理の徹底", "写真&動画全て無料", "少人数制で安心", "器材レンタル無料"],
        included: ["シュノーケル器材", "ライフジャケット", "写真・動画データ", "保険"],
      },
      {
        id: "S2",
        label: "貸切プラン",
        price: "¥9,000/人",
        priceNote: "1人あたり（最大6名）",
        highlights: ["完全貸切・専属ガイド", "ウェットスーツ無料", "度付きメガネ無料", "こだわりの撮影"],
        included: ["全器材一式", "ウェットスーツ", "度付きメガネ", "写真・動画データ", "保険"],
      },
    ],
  },
  {
    name: "本格ナイトツアー",
    tagline: "アマゾン帰りの男と行く夜の大冒険",
    description: "懐中電灯を持って夜のジャングルへ！巨大ヤシガニや夜行性の生き物を探す冒険ツアー。0歳から参加OK、三世代でも楽しめます。",
    image: "/images/night-tour-coconut-crab.jpg",
    duration: "約1.5時間",
    age: "0〜75歳",
    rating: 5.0,
    reviews: 2643,
    badge: "家族人気No.1",
    badgeColor: "bg-emerald-500 text-white",
    variants: [
      {
        id: "S3",
        label: "通常プラン",
        price: "¥4,000",
        priceNote: "一律料金（3歳以下無料）",
        highlights: ["0歳から参加OK", "3歳以下は無料", "巨大ヤシガニに遭遇", "満天の星空も"],
        included: ["懐中電灯", "ガイド同行", "写真データ", "保険"],
      },
      {
        id: "S5",
        label: "貸切プラン",
        price: "¥8,000/人",
        priceNote: "一律料金（3歳以下無料）",
        highlights: ["完全貸切・専属ガイド", "じっくり解説付き", "お子様のペースで探検", "3歳以下は無料"],
        included: ["懐中電灯", "専属ガイド", "写真データ", "保険"],
      },
    ],
  },
  {
    name: "サンセットSUP",
    tagline: "1日1組だけの特別な夕日体験",
    description: "1日1組限定！海の上から眺める夕日のグラデーションは圧巻。初心者でも安定のボードで安心。エモーショナルなシルエット写真が大人気。",
    image: "/images/sunset-sup-silhouettes.jpg",
    duration: "約2時間",
    age: "5〜65歳",
    rating: 5.0,
    reviews: 2891,
    badge: "1日1組限定",
    badgeColor: "bg-orange-500 text-white",
    variants: [
      {
        id: "S4",
        label: "",
        price: "¥8,000",
        priceNote: "子供¥6,000",
        highlights: ["1日1組限定", "マジックアワー体験", "シルエット写真撮影", "初心者OK"],
        included: ["SUPボード", "パドル", "ライフジャケット", "写真・動画データ", "保険"],
      },
    ],
  },
]

function TourCard({ tour }: { tour: Tour }) {
  const [selectedVariant, setSelectedVariant] = useState(0)
  const variant = tour.variants[selectedVariant]
  const hasMultipleVariants = tour.variants.length > 1

  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-[400px] md:w-[440px] snap-center">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={tour.image}
            alt={tour.name}
            fill
            quality={80}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URLS.turtle}
            className="object-cover"
            sizes="(max-width: 640px) 85vw, 440px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          <span className={`absolute top-3 left-3 ${tour.badgeColor} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
            {tour.badge}
          </span>

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-xs">{tour.rating}</span>
            <span className="text-white/70 text-[10px]">({tour.reviews.toLocaleString()}件)</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">{tour.name}</h3>
          <p className="text-emerald-600 font-semibold text-xs mb-2">{tour.tagline}</p>

          {/* Quick info */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{tour.duration}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{tour.age}</span>
            </div>
          </div>

          {/* Variant toggle */}
          {hasMultipleVariants && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {tour.variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(i)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    selectedVariant === i
                      ? i === 0
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className={`text-[10px] font-semibold mb-0.5 ${
                    selectedVariant === i && i === 1 ? "text-purple-600" : "text-gray-500"
                  }`}>{v.label}</p>
                  <p className={`font-bold text-sm ${
                    selectedVariant === i
                      ? i === 0 ? "text-emerald-600" : "text-purple-600"
                      : "text-gray-700"
                  }`}>{v.price}</p>
                </button>
              ))}
            </div>
          )}

          {/* Price for single variant */}
          {!hasMultipleVariants && (
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xl font-bold text-emerald-600">{variant.price}</p>
              <p className="text-[10px] text-gray-500">{variant.priceNote}</p>
            </div>
          )}

          {/* Highlights */}
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {variant.highlights.map((h) => (
              <div key={h} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-700">{h}</span>
              </div>
            ))}
          </div>

          {/* Included tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {variant.included.map((item) => (
              <span key={item} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                {item}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex gap-2 mt-auto">
            <Link
              href={`/book?plan=${variant.id}`}
              className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md"
            >
              予約する
            </Link>
            <Link
              href={`/plans/${variant.id}`}
              className="flex-1 text-center border-2 border-emerald-500 text-emerald-600 font-bold text-sm py-3 rounded-xl transition-all active:scale-95"
            >
              詳細を見る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PlansSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 10)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
    const cardWidth = el.firstElementChild?.clientWidth || 300
    const gap = 12
    const index = Math.round(el.scrollLeft / (cardWidth + gap))
    setActiveIndex(Math.min(index, tours.length - 1))
  }

  const scrollTo = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild?.clientWidth || 300
    el.scrollBy({ left: direction === "left" ? -cardWidth - 12 : cardWidth + 12, behavior: "smooth" })
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    updateScrollState()
    return () => el.removeEventListener("scroll", updateScrollState)
  }, [])

  return (
    <section className="py-12 sm:py-16 md:py-28 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 sm:mb-12 px-5 sm:px-6 lg:px-8"
        >
          <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Tour Plans</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            あなたにぴったりの<span className="text-emerald-600">プラン</span>を見つけよう
          </h2>
          <p className="text-gray-500 text-sm sm:text-lg max-w-2xl mx-auto">
            全3ツアー。通常プランと貸切プランから選べます。写真無料・前日キャンセル無料。
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-5 sm:px-6 lg:px-8 pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {tours.map((tour) => (
              <TourCard key={tour.name} tour={tour} />
            ))}
          </div>

          {canScrollLeft && (
            <button
              onClick={() => scrollTo("left")}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollTo("right")}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {tours.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = scrollRef.current
                if (!el) return
                const cardWidth = el.firstElementChild?.clientWidth || 300
                el.scrollTo({ left: i * (cardWidth + 12), behavior: "smooth" })
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? "w-6 bg-emerald-500" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Common info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-10 sm:mt-16 mx-5 sm:mx-6 lg:mx-8 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-100"
        >
          <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">全プラン共通</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {[
              { icon: Camera, text: "写真・動画データ無料", sub: "枚数制限なし" },
              { icon: Shield, text: "保険加入済み", sub: "安全講習あり" },
              { icon: Clock, text: "前日までキャンセル無料", sub: "天候不良は全額返金" },
              { icon: Users, text: "現地集合・現地解散", sub: "現金決済" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50">
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] sm:text-sm font-semibold text-gray-900">{item.text}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
