"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValue, useAnimationControls } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Star, Clock, Users, Camera, Shield, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

const plans = [
  {
    id: "S1", rank: 1, badge: "一番人気", badgeColor: "bg-yellow-400 text-yellow-900",
    name: "ウミガメシュノーケル", tagline: "遭遇率100%継続中！",
    description: "宮古島の透き通る海で、ウミガメと一緒に泳ぐ感動体験。少人数制だからお子様も安心。高画質の写真・動画は全て無料プレゼント。",
    image: "/images/s1-sea-turtle-snorkeling.jpg",
    price: "¥6,000〜", priceNote: "大人¥6,500 / 子供¥6,000",
    duration: "約2時間", age: "5〜65歳", rating: 4.9, reviews: 3842,
    highlights: ["ウミガメ遭遇率100%", "写真&動画全て無料", "少人数制で安心", "器材レンタル無料"],
    included: ["シュノーケル器材", "ライフジャケット", "写真・動画データ", "保険"],
  },
  {
    id: "S2", rank: 2, badge: "特別プラン", badgeColor: "bg-purple-500 text-white",
    name: "VIP貸切ツアー", tagline: "1組限定の完全プライベート",
    description: "他のお客様を気にせず、自分たちだけの特別な時間を。専属ガイドがつくから、小さなお子様や泳ぎが苦手な方も絶対安心。",
    image: "/images/s2-sea-turtle-closeup.jpg",
    price: "¥9,000", priceNote: "1人あたり（最大6名）",
    duration: "約2時間", age: "5〜65歳", rating: 5.0, reviews: 1247,
    highlights: ["完全貸切・専属ガイド", "ウェットスーツ無料", "度付きメガネ無料", "こだわりの撮影"],
    included: ["全器材一式", "ウェットスーツ", "度付きメガネ", "写真・動画データ", "保険"],
  },
  {
    id: "S3", rank: 3, badge: "家族人気No.1", badgeColor: "bg-emerald-500 text-white",
    name: "本格ナイトツアー", tagline: "アマゾン帰りの男と行く夜の大冒険",
    description: "懐中電灯を持って夜のジャングルへ！巨大ヤシガニや夜行性の生き物を探す冒険ツアー。0歳から参加OK、三世代でも楽しめます。",
    image: "/images/night-hunter-crab.jpg",
    price: "¥4,000", priceNote: "一律料金（3歳以下無料）",
    duration: "約1.5時間", age: "0〜75歳", rating: 5.0, reviews: 2156,
    highlights: ["0歳から参加OK", "3歳以下は無料", "巨大ヤシガニに遭遇", "満天の星空も"],
    included: ["懐中電灯", "ガイド同行", "写真データ", "保険"],
  },
  {
    id: "S4", rank: 4, badge: "映え度No.1", badgeColor: "bg-orange-500 text-white",
    name: "サンセットSUP", tagline: "黄金の海で極上のひととき",
    description: "海の上から眺める夕日のグラデーションは圧巻。初心者でも安定のボードで安心。エモーショナルなシルエット写真が大人気。",
    image: "/images/sunset-sup-silhouettes.jpg",
    price: "¥6,000〜", priceNote: "大人¥8,000 / 子供¥6,000",
    duration: "約2時間", age: "5〜65歳", rating: 5.0, reviews: 2891,
    highlights: ["マジックアワー体験", "初心者OK", "シルエット写真撮影", "座ったままでもOK"],
    included: ["SUPボード", "パドル", "ライフジャケット", "写真・動画データ", "保険"],
  },
]

function PlanCard({ plan }: { plan: typeof plans[0] }) {
  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-[400px] md:w-[420px] snap-center">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={plan.image}
            alt={plan.name}
            fill
            quality={80}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URLS.turtle}
            className="object-cover"
            sizes="(max-width: 640px) 85vw, 420px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {/* Badge */}
          <span className={`absolute top-3 left-3 ${plan.badgeColor} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
            {plan.badge}
          </span>

          {/* Rating */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-xs">{plan.rating}</span>
            <span className="text-white/70 text-[10px]">({plan.reviews.toLocaleString()}件)</span>
          </div>

          {/* Price */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
            <p className="text-red-600 font-bold text-sm leading-tight">{plan.price}</p>
            <p className="text-gray-500 text-[9px] leading-tight">{plan.priceNote}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">{plan.name}</h3>
          <p className="text-emerald-600 font-semibold text-xs mb-3">{plan.tagline}</p>
          <p className="text-gray-600 text-xs leading-relaxed mb-4 line-clamp-2">{plan.description}</p>

          {/* Quick info */}
          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{plan.duration}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{plan.age}</span>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-4 grid grid-cols-2 gap-1.5">
            {plan.highlights.map((h) => (
              <div key={h} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-700">{h}</span>
              </div>
            ))}
          </div>

          {/* Included tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {plan.included.map((item) => (
              <span key={item} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                {item}
              </span>
            ))}
          </div>

          {/* CTA - pushed to bottom */}
          <div className="flex gap-2 mt-auto">
            <Link
              href={`/book?plan=${plan.id}`}
              className="flex-1 text-center bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md"
            >
              予約する
            </Link>
            <Link
              href={`/plans/${plan.id}`}
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

    // Calculate active index based on scroll position
    const cardWidth = el.firstElementChild?.clientWidth || 300
    const gap = 12
    const index = Math.round(el.scrollLeft / (cardWidth + gap))
    setActiveIndex(Math.min(index, plans.length - 1))
  }

  const scrollTo = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const cardWidth = el.firstElementChild?.clientWidth || 300
    const scrollAmount = direction === "left" ? -cardWidth - 12 : cardWidth + 12
    el.scrollBy({ left: scrollAmount, behavior: "smooth" })
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
        {/* Header */}
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
            シュノーケルからSUP、夜の冒険まで。全プラン写真無料・前日キャンセル無料。
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-5 sm:px-6 lg:px-8 pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {/* Desktop arrows */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTo("left")}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
              aria-label="前のプラン"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollTo("right")}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
              aria-label="次のプラン"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-5">
          {plans.map((_, i) => (
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
              aria-label={`プラン${i + 1}に移動`}
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
