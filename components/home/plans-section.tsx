"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import { Clock, Users, Camera, Shield, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/image-placeholders"
import { PLAN_COVER_IMAGE, TOUR_IMAGE_PATHS } from "@/lib/tour-assets"
import { ComingSoonBadge } from "@/components/coming-soon"
import { trackEvent } from "@/lib/analytics"
import { getPlanPriceDisplay, getPlanCode } from "@/lib/plan-price-display"

interface PlanVariant {
  id: string
  label: string
  price: string
  priceNote: string
  highlights: string[]
  included: string[]
  status?: "active" | "coming_soon"
}

interface Tour {
  name: string
  tagline: string
  description: string
  image: string
  images?: readonly string[]
  imageAlts?: readonly string[]
  duration: string
  age: string
  badge: string
  badgeColor: string
  status?: "active" | "coming_soon"
  variants: PlanVariant[]
}

const tours: Tour[] = [
  {
    name: "ウミガメシュノーケルツアー",
    tagline: "安全管理徹底！少人数制で安心の感動体験",
    description: "宮古島の透き通る海で、ウミガメと一緒に泳ぐ感動体験。安全管理を徹底した少人数制だからお子様も安心。高画質の写真・動画は全て無料プレゼント。",
    image: PLAN_COVER_IMAGE.snorkel,
    images: TOUR_IMAGE_PATHS.snorkel,
    imageAlts: [
      "宮古島でウミガメと一緒に泳ぐシュノーケルツアー",
      "家族で楽しめる宮古島のシュノーケルツアー",
      "ガイドが近くでサポートする初心者向けシュノーケル",
      "透明度の高い宮古島の海を楽しむシュノーケル",
      "浅瀬から入れる宮古島のシュノーケルツアー",
      "ウミガメと近くで出会える宮古島シュノーケルツアー",
    ],
    duration: "約2時間",
    age: "5〜65歳",
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
        priceNote: "1人あたり（最大10名）",
        highlights: ["完全貸切・専属ガイド", "ウェットスーツ無料", "度付きメガネ無料", "こだわりの撮影"],
        included: ["全器材一式", "ウェットスーツ", "度付きメガネ", "写真・動画データ", "保険"],
      },
    ],
  },
  {
    name: "本格ナイトツアー",
    tagline: "アマゾン帰りの男と行く夜の大冒険",
    description: "懐中電灯を持って夜のジャングルへ！巨大ヤシガニや夜行性の生き物を探す冒険ツアー。0歳から参加OK、三世代でも楽しめます。",
    image: PLAN_COVER_IMAGE.night,
    images: TOUR_IMAGE_PATHS.night,
    imageAlts: [
      "宮古島の夜にヤシガニを探すナイトツアー",
      "家族で楽しむ宮古島ナイトツアー",
      "ガイドと一緒に宮古島の夜を探検するナイトツアー",
      "宮古島ナイトツアーで出会う夜行性のカエルなどの生き物",
      "ガイドとヤシガニを観察する宮古島ナイトツアー",
      "夜の生き物を間近で観察する宮古島ナイトツアー",
    ],
    duration: "約1.5時間",
    age: "0〜75歳",
    badge: "家族人気No.1",
    badgeColor: "bg-emerald-700 text-white",
    variants: [
      {
        id: "S3",
        label: "通常プラン",
        price: "¥4,000",
        priceNote: "一律料金（3歳以下無料）",
        highlights: ["0歳から参加OK", "3歳以下は無料", "巨大ヤシガニに遭遇", "夜行性の生き物に出会える"],
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
    tagline: "夕日を浴びながらの海上散歩とドローン空撮",
    description: "海の上から眺める夕日のグラデーションは圧巻。ドローン空撮付きで、夕日に染まる海に浮かぶ姿を上空からも残せます。初心者でも安定のボードで安心。通常プランと1組貸切から選べます。",
    image: PLAN_COVER_IMAGE.sup,
    images: TOUR_IMAGE_PATHS.sup,
    imageAlts: [
      "宮古島の夕日の中でタンデムSUPを楽しむ参加者",
      "夕焼け空にパドルを掲げる宮古島サンセットSUP",
      "夕日が沈む水平線を眺める宮古島サンセットSUP",
    ],
    duration: "約2時間",
    age: "5〜65歳",
    badge: "映え度No.1",
    badgeColor: "bg-orange-700 text-white",
    variants: [
      {
        id: "S8",
        label: "通常プラン",
        price: "¥7,500",
        priceNote: "子供¥6,500",
        highlights: ["ドローン空撮付き", "マジックアワー体験", "シルエット写真撮影", "少人数制"],
        included: ["SUPボード", "パドル", "ライフジャケット", "ドローン撮影", "写真・動画データ", "保険"],
      },
      {
        id: "S4",
        label: "貸切プラン",
        price: "¥9,500",
        priceNote: "子供¥8,500",
        highlights: ["1組貸切・専属ガイド", "ドローン空撮付き", "ウェットスーツ無料", "度付きマスク無料"],
        included: ["SUPボード", "パドル", "ライフジャケット", "ウェットスーツ", "度付きマスク", "ドローン撮影", "写真・動画データ", "保険"],
      },
    ],
  },
  {
    name: "宮古島ドローンSUP体験",
    tagline: "日中の宮古ブルーを海上と空から撮影",
    description: "透明度の高い宮古ブルーで楽しむ日中SUP。初心者でも安心のボードで海上散歩を楽しみながら、ドローン空撮で絶景写真・動画を残せます。",
    image: PLAN_COVER_IMAGE.daySup,
    images: TOUR_IMAGE_PATHS.daySup,
    imageAlts: [
      "宮古ブルーの海でパドルを掲げる日中SUP体験",
      "透明度の高い宮古島の海を空から撮影したSUPツアー",
      "宮古島の海を真上から撮影したドローンSUP写真",
    ],
    duration: "約2時間",
    age: "5〜65歳",
    badge: "ドローン撮影付き",
    badgeColor: "bg-cyan-700 text-white",
    variants: [
      {
        id: "S6",
        label: "通常プラン",
        price: "¥7,500",
        priceNote: "子供¥6,500",
        highlights: ["ドローン撮影付き", "宮古ブルー", "日中SUP", "初心者OK"],
        included: ["SUPボード", "パドル", "ライフジャケット", "写真・動画データ", "保険"],
      },
      {
        id: "S7",
        label: "貸切プラン",
        price: "¥9,500",
        priceNote: "子供¥8,500",
        highlights: ["1組貸切", "専属ガイド", "ドローン撮影付き", "日中SUP"],
        included: ["SUPボード", "パドル", "ライフジャケット", "写真・動画データ", "保険", "専属ガイド"],
      },
    ],
  },
  {
    name: "ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
    tagline: "昼はウミガメ、夜はヤシガニ探検",
    description: "人気のウミガメシュノーケル（昼）とヤシガニ探検（夜）をセットに。宮古島の海と夜の自然を1日で楽しめる、通常より1,000円お得な昼夜セットです。",
    image: PLAN_COVER_IMAGE.combo,
    images: TOUR_IMAGE_PATHS.combo,
    imageAlts: [
      "宮古島の昼ウミガメシュノーケルと夜ナイトツアーをセットにした複合プラン",
      "宮古島でウミガメと泳ぐ昼のシュノーケルツアー",
      "宮古島の夜にヤシガニを探すナイトツアー",
      "透明度の高い宮古島の海を楽しむシュノーケル",
      "ガイドと一緒に夜の生き物を観察する宮古島ナイトツアー",
    ],
    duration: "昼2h＋夜1.5h",
    age: "5〜65歳",
    badge: "セットでお得",
    badgeColor: "bg-emerald-700 text-white",
    variants: [
      {
        id: "C1",
        label: "通常セット",
        price: "¥9,500",
        priceNote: "子供¥9,000",
        highlights: ["昼:ウミガメシュノーケル", "夜:ヤシガニ探検", "海と夜を1日で", "通常より1,000円お得"],
        included: ["シュノーケル器材", "懐中電灯", "写真・動画データ", "保険"],
      },
      {
        id: "C2",
        label: "貸切セット",
        price: "¥16,000",
        priceNote: "大人・子供",
        highlights: ["昼も夜も完全貸切", "専属ガイドで安心", "ヤシガニ探検も貸切", "通常より1,000円お得"],
        included: ["専属ガイド", "シュノーケル器材", "懐中電灯", "写真・動画データ", "保険"],
      },
    ],
  },
  {
    name: "ウミガメシュノーケル＆ドローンSUP 海空セット",
    tagline: "昼は海でウミガメ、空からドローンSUP",
    description: "人気のウミガメシュノーケルとドローンSUP体験をセットに。基本的に同じビーチで連続開催し、海に潜って遊び、海上＆空撮で宮古ブルーを丸ごと残す、通常より1,000円お得な海空セットです。",
    image: PLAN_COVER_IMAGE.comboSeaSky,
    images: TOUR_IMAGE_PATHS.comboSeaSky,
    imageAlts: [
      "宮古島のウミガメシュノーケルとドローンSUPをセットにした海空プラン",
      "宮古島でウミガメと泳ぐシュノーケルツアー",
      "宮古ブルーの海上を進むドローンSUP体験",
      "透明度の高い宮古島の海を楽しむシュノーケル",
      "上空から撮影した宮古島のターコイズブルーの海とSUP",
    ],
    duration: "約3時間",
    age: "5〜65歳",
    badge: "セットでお得",
    badgeColor: "bg-cyan-700 text-white",
    variants: [
      {
        id: "C3",
        label: "通常セット",
        price: "¥13,000",
        priceNote: "子供¥11,500",
        highlights: ["昼:ウミガメシュノーケル", "昼:ドローンSUP空撮", "海と空を1日で", "通常より1,000円お得"],
        included: ["シュノーケル器材", "SUPボード", "ドローン撮影データ", "写真・動画データ", "保険"],
      },
      {
        id: "C4",
        label: "貸切セット",
        price: "¥17,500",
        priceNote: "子供¥16,500",
        highlights: ["海も空も完全貸切", "専属ガイドで安心", "ドローン撮影付き", "通常より1,000円お得"],
        included: ["専属ガイド", "シュノーケル器材", "SUPボード", "ドローン撮影データ", "写真・動画データ", "保険"],
      },
    ],
  },
  {
    name: "ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
    tagline: "朝は海、昼は空、夜はジャングル。宮古島を1日で遊び尽くす",
    description: "ウミガメシュノーケル・ドローンSUP・ナイトツアーの人気3ツアーを1日で。朝・昼・夜と宮古島を遊び尽くす、通常より2,000円お得なまるごと1日セットです。",
    image: PLAN_COVER_IMAGE.comboFullDay,
    images: TOUR_IMAGE_PATHS.comboFullDay,
    imageAlts: [
      "宮古島のウミガメシュノーケル・ドローンSUP・ナイトツアーを1日で楽しむまるごとプラン",
      "宮古島でウミガメと泳ぐシュノーケルツアー",
      "宮古ブルーの海上を進むドローンSUP体験",
      "夜の宮古島でヤシガニを探すナイトツアー",
      "透明度の高い宮古島の海を楽しむシュノーケル",
    ],
    duration: "朝〜夜の1日",
    age: "5〜65歳",
    badge: "3つでお得",
    badgeColor: "bg-emerald-700 text-white",
    variants: [
      {
        id: "C5",
        label: "通常セット",
        price: "¥16,000",
        priceNote: "子供¥14,500",
        highlights: ["朝:ウミガメシュノーケル", "昼:ドローンSUP", "夜:ナイトツアー", "通常より2,000円お得"],
        included: ["シュノーケル器材", "SUPボード", "懐中電灯", "ドローン撮影データ", "写真・動画データ", "保険"],
      },
      {
        id: "C6",
        label: "貸切セット",
        price: "¥24,500",
        priceNote: "子供¥23,500",
        highlights: ["朝も昼も夜も完全貸切", "専属ガイドで安心", "海・空・夜を1日で", "通常より2,000円お得"],
        included: ["専属ガイド", "シュノーケル器材", "SUPボード", "懐中電灯", "ドローン撮影データ", "保険"],
      },
    ],
  },
  {
    name: "スライダーボートシュノーケル",
    tagline: "滑り台付きボートで遊ぶ新プラン",
    description: "トゥリバーマリーナ集合の滑り台付きボートシュノーケルがまもなく登場。滑り台・飛び込み台・ボートシュノーケルで、宮古島の海をもっとアクティブに楽しめます。",
    image: "/images/slide-boat-photo.jpg",
    images: TOUR_IMAGE_PATHS.slideBoat,
    duration: "約3時間",
    age: "5〜65歳予定",
    badge: "Coming Soon",
    badgeColor: "bg-cyan-100 text-cyan-800",
    status: "coming_soon",
    variants: [
      {
        id: "slide-boat",
        label: "近日公開",
        price: "¥14,000",
        priceNote: "子供¥12,000",
        highlights: ["滑り台付きボート", "飛び込み台", "午前・午後の2便", "トゥリバーマリーナ集合"],
        included: ["乗船料", "シュノーケル器材", "ライフジャケット", "保険"],
        status: "coming_soon",
      },
    ],
  },
]

// 名称は語尾に「ツアー」「セットプラン」等を必ず付け、何の商品か一目で分かるようにする（2026-07-12 オーナー要望）
const quickCompare = [
  { id: "S1", name: "海亀ツアー", age: "5〜65歳", time: "約2時間", bestFor: "初めて・家族・友人" },
  { id: "S3", name: "ナイトツアー", age: "0〜75歳", time: "約1.5時間", bestFor: "小さな子連れ・三世代" },
  { id: "S8", name: "サンセットSUPツアー", age: "5〜65歳", time: "約2時間", bestFor: "夕日の空撮・カップル" },
  { id: "S4", name: "貸切サンセットSUPツアー", age: "5〜65歳", time: "約2時間", bestFor: "1組貸切で夕日撮影" },
  { id: "S6", name: "ドローンSUPツアー", age: "5〜65歳", time: "約2時間", bestFor: "日中の海・空撮写真" },
  { id: "S7", name: "貸切ドローンSUPツアー", age: "5〜65歳", time: "約2時間", bestFor: "1組貸切で空撮SUP" },
  { id: "C1", name: "昼夜セットプラン", age: "5〜65歳", time: "昼2h＋夜1.5h", bestFor: "海と夜を1日で満喫" },
  { id: "C2", name: "貸切昼夜セットプラン", age: "5〜65歳", time: "昼2h＋夜1.5h", bestFor: "家族・貸切で満喫" },
  { id: "C3", name: "海空セットプラン", age: "5〜65歳", time: "約3h", bestFor: "海も空も同じ浜で満喫" },
  { id: "C4", name: "貸切海空セットプラン", age: "5〜65歳", time: "約3h", bestFor: "海も空も1組貸切で満喫" },
  { id: "C5", name: "まるごと1日セットプラン", age: "5〜65歳", time: "朝〜夜", bestFor: "海・空・夜を1日で満喫" },
  { id: "C6", name: "貸切まるごと1日セットプラン", age: "5〜65歳", time: "朝〜夜", bestFor: "1日まるごと完全貸切" },
  { id: "slide-boat", name: "スライダーボートツアー", age: "5〜65歳予定", time: "約3時間", bestFor: "家族・グループ・アクティブ", status: "coming_soon" },
]

function priceToneClass(tone: "emerald" | "purple" | "cyan") {
  if (tone === "purple") return "text-purple-700"
  if (tone === "cyan") return "text-cyan-700"
  return "text-emerald-700"
}

function PlanPricePair({ planId, tone = "emerald", dense = false }: { planId: string; tone?: "emerald" | "purple" | "cyan"; dense?: boolean }) {
  const priceDisplay = getPlanPriceDisplay(planId)
  if (!priceDisplay) return null

  return (
    <div className={dense ? "mt-1" : ""}>
      <div className="mb-1 flex justify-center">
        <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-gray-600">{getPlanCode(planId)}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {priceDisplay.rows.map((row) => (
          <div key={row.label} className={`rounded-lg bg-white/75 border border-white/80 ${dense ? "px-1.5 py-1" : "px-2.5 py-2"}`}>
            <span className="block text-[9px] font-semibold leading-none text-gray-500">{row.label}</span>
            <span className={`block font-black leading-tight ${dense ? "text-xs" : "text-lg"} ${priceToneClass(tone)}`}>
              {row.price}
            </span>
          </div>
        ))}
      </div>
      {priceDisplay.caption && <p className="mt-1 text-[9px] font-medium text-gray-500">{priceDisplay.caption}</p>}
    </div>
  )
}

function CarouselImage({ src, fallbackSrc, alt }: { src: string; fallbackSrc: string; alt: string }) {
  const [resolvedSrc, setResolvedSrc] = useState(src)

  useEffect(() => {
    setResolvedSrc(src)
  }, [src])

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      quality={80}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URLS.turtle}
      className="object-cover"
      sizes="(max-width: 640px) 85vw, 440px"
      onError={() => {
        if (resolvedSrc !== fallbackSrc) setResolvedSrc(fallbackSrc)
      }}
    />
  )
}

function TourImageCarousel({ tour, isComingSoon }: { tour: Tour; isComingSoon: boolean }) {
  const imageScrollRef = useRef<HTMLDivElement>(null)
  const [activeImage, setActiveImage] = useState(0)
  const images = tour.images?.length ? tour.images : [tour.image]
  const hasMultipleImages = images.length > 1

  const scrollImageTo = (index: number) => {
    const el = imageScrollRef.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * index, behavior: "smooth" })
  }

  const moveImage = (direction: "previous" | "next") => {
    const nextIndex = direction === "previous" ? activeImage - 1 : activeImage + 1
    scrollImageTo((nextIndex + images.length) % images.length)
  }

  useEffect(() => {
    const el = imageScrollRef.current
    if (!el) return

    const updateActiveImage = () => {
      const nextIndex = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1))
      setActiveImage(Math.min(Math.max(nextIndex, 0), images.length - 1))
    }

    el.addEventListener("scroll", updateActiveImage, { passive: true })
    updateActiveImage()
    return () => el.removeEventListener("scroll", updateActiveImage)
  }, [images.length])

  return (
    // モバイルは16/9でやや低く（カード全体＋下部固定バーが1画面に収まる高さ予算のため）。sm以上は従来どおり
    <div className="relative aspect-[16/9] sm:aspect-[16/10] overflow-hidden">
      <div
        ref={imageScrollRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x", overscrollBehaviorX: "contain" }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
      >
        {images.map((src, index) => (
          <div key={`${tour.name}-${src}-${index}`} className="relative h-full w-full flex-none snap-center">
            <CarouselImage
              src={src}
              fallbackSrc={tour.image}
              alt={tour.imageAlts?.[index] ?? `${tour.name}の写真 ${index + 1}`}
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <span className={`absolute top-3 left-3 z-20 ${tour.badgeColor} text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
        {tour.badge}
      </span>

      {isComingSoon && (
        <ComingSoonBadge className="absolute bottom-3 left-3 z-20 bg-white/90" />
      )}

      {hasMultipleImages && (
        <>
          <button
            type="button"
            aria-label="前の写真"
            onClick={() => moveImage("previous")}
            className="hidden md:flex absolute left-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="次の写真"
            onClick={() => moveImage("next")}
            className="hidden md:flex absolute right-3 top-1/2 z-20 h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* ドットの見た目は小さいまま、ボタン自体は24px四方以上を確保する（WCAG 2.2 target size） */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full bg-black/25 px-1 backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`${index + 1}枚目の写真を表示`}
                onClick={() => scrollImageTo(index)}
                className="flex h-6 w-6 items-center justify-center"
              >
                <span
                  aria-hidden
                  className={`h-1.5 rounded-full transition-all ${index === activeImage ? "w-4 bg-white" : "w-1.5 bg-white/55"}`}
                />
              </button>
            ))}
          </div>

          <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            <Camera className="h-3 w-3" />
            写真 {images.length}枚
          </div>
        </>
      )}
    </div>
  )
}

function TourCard({ tour }: { tour: Tour }) {
  const [selectedVariant, setSelectedVariant] = useState(0)
  const variant = tour.variants[selectedVariant]
  const hasMultipleVariants = tour.variants.length > 1
  const isComingSoon = tour.status === "coming_soon" || variant.status === "coming_soon"

  return (
    <div className="flex-shrink-0 w-[85vw] sm:w-[400px] md:w-[440px] snap-center">
      {/* h-fullを付けると隣の背が高いカード（プラン名2行＋価格注釈のセット系）に合わせて
          タグとボタンの間に大きな余白が生まれるため、カードは中身ぴったりの高さにする */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
        <TourImageCarousel tour={tour} isComingSoon={isComingSoon} />

        {/* Content */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-0.5">{tour.name}</h3>
          <p className="text-emerald-700 font-semibold text-xs mb-1.5 sm:mb-2">{tour.tagline}</p>

          {/* Quick info */}
          <div className="flex gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1 sm:py-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{tour.duration}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2.5 py-1 sm:py-1.5">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-700">{tour.age}</span>
            </div>
          </div>

          {/* Variant toggle */}
          {hasMultipleVariants && (
            <div className="grid grid-cols-2 gap-2 mb-3 sm:mb-4">
              {tour.variants.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(i)}
                  className={`p-2 sm:p-2.5 rounded-xl border-2 text-center transition-all ${
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
                  <PlanPricePair planId={v.id} tone={i === 1 ? "purple" : "emerald"} dense />
                </button>
              ))}
            </div>
          )}

          {/* Price for single variant */}
          {!hasMultipleVariants && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-gray-50 rounded-xl">
              <PlanPricePair planId={variant.id} tone={isComingSoon ? "cyan" : "emerald"} />
            </div>
          )}

          {/* Highlights */}
          <div className="mb-2.5 sm:mb-3 grid grid-cols-2 gap-1 sm:gap-1.5">
            {variant.highlights.map((h) => (
              <div key={h} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-[11px] text-gray-700">{h}</span>
              </div>
            ))}
          </div>

          {/* Included tags */}
          <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-5">
            {variant.included.map((item) => (
              <span key={item} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                {item}
              </span>
            ))}
          </div>

          {/* CTA */}
          {isComingSoon ? (
            <Link
              href={`/plans/${variant.id}#coming-soon`}
              className="mt-auto block text-center bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95 shadow-md"
            >
              近日公開を見る
            </Link>
          ) : (
            <div className="flex gap-2 mt-auto">
              <Link
                href={`/book?plan=${variant.id}`}
                onClick={() => trackEvent("book_cta_click", { location: "plan_card", plan: variant.id })}
                className="flex-1 text-center bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm py-2.5 sm:py-3 rounded-xl transition-all active:scale-95 shadow-md"
              >
                予約する
              </Link>
              <Link
                href={`/plans/${variant.id}`}
                className="flex-1 text-center border-2 border-emerald-500 text-emerald-700 font-bold text-sm py-2.5 sm:py-3 rounded-xl transition-all active:scale-95"
              >
                詳細を見る
              </Link>
            </div>
          )}
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
    <section id="plans" className="py-12 sm:py-16 md:py-24 bg-gray-50 relative overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 px-5 sm:px-6 lg:px-8">
          <p className="text-emerald-700 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Tour Plans</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-3">
            料金・対象年齢で<span className="text-emerald-600">すぐ比較</span>
          </h2>
          <p className="text-gray-500 text-sm sm:text-lg max-w-2xl mx-auto">
            迷ったら、まずは年齢と料金で選んでください。詳しい相談はLINEで確認できます。
          </p>
        </div>

        <div className="px-5 sm:px-6 lg:px-8 mb-8">
          {/* モバイルもPCと同じ4列の比較表で表示（2026-07-12 オーナー要望でカード表示を廃止）。
              狭い画面では表内を横スクロールできるようにし、縦に間延びしないようにする。 */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="min-w-[560px] md:min-w-0">
              <div className="grid grid-cols-4 bg-emerald-900 text-white text-[11px] sm:text-sm font-bold">
                <div className="p-3 sm:p-4">ツアー</div>
                <div className="p-3 sm:p-4">料金</div>
                <div className="p-3 sm:p-4">対象・所要</div>
                <div className="p-3 sm:p-4">おすすめ</div>
              </div>
              {quickCompare.map((item) => {
                const priceDisplay = getPlanPriceDisplay(item.id)

                return (
                  <div key={item.name} className="grid grid-cols-4 border-t border-gray-100 text-[11px] sm:text-sm">
                    <div className="p-3 sm:p-4 font-bold text-gray-900">
                      <span className="mr-1 inline-block rounded bg-gray-100 px-1 py-0.5 align-middle text-[9px] font-bold tracking-wider text-gray-600">{getPlanCode(item.id)}</span>
                      <span className="align-middle">{item.name}</span>
                      {item.status === "coming_soon" && <ComingSoonBadge className="mt-1 px-2 py-0.5 text-[10px]" />}
                    </div>
                    <div className="p-3 sm:p-4 font-bold leading-snug text-emerald-700">
                      {priceDisplay?.rows.map((row) => (
                        <span key={row.label} className="block whitespace-nowrap">
                          {row.label}{row.price}
                        </span>
                      ))}
                      {priceDisplay?.caption && <span className="block text-[10px] font-medium text-gray-500">{priceDisplay.caption}</span>}
                    </div>
                    <div className="p-3 sm:p-4 text-gray-700">
                      {item.age}
                      <span className="block text-gray-600">{item.time}</span>
                    </div>
                    <div className="p-3 sm:p-4 text-gray-700">{item.bestFor}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">写真・動画無料</span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">前日までキャンセル無料</span>
            <span className="rounded-full bg-white px-3 py-1 border border-gray-200">天候不良の中止も無料</span>
          </div>
        </div>

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
              type="button"
              aria-label="前のプランを見る"
              onClick={() => scrollTo("left")}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              aria-label="次のプランを見る"
              onClick={() => scrollTo("right")}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-colors z-10"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>

        {/* Dots — 見た目は小さいまま、ボタン自体は24px四方以上を確保する（WCAG 2.2 target size） */}
        <div className="flex justify-center mt-4">
          {tours.map((_, i) => (
            <button
              type="button"
              key={i}
              aria-label={`${i + 1}番目のプランへ移動`}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => {
                const el = scrollRef.current
                if (!el) return
                const cardWidth = el.firstElementChild?.clientWidth || 300
                el.scrollTo({ left: i * (cardWidth + 12), behavior: "smooth" })
              }}
              className="flex h-7 w-7 items-center justify-center"
            >
              <span
                aria-hidden
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "w-6 bg-emerald-600" : "w-2 bg-gray-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Common info */}
        <div className="mt-10 sm:mt-16 mx-5 sm:mx-6 lg:mx-8 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-100">
          <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 text-center">全プラン共通</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
            {[
              { icon: Camera, text: "写真・動画データ無料", sub: "枚数制限なし" },
              { icon: Shield, text: "保険加入済み", sub: "安全講習あり" },
              { icon: Clock, text: "前日までキャンセル無料", sub: "天候不良の中止も無料" },
              { icon: Users, text: "現地集合・現地解散", sub: "現地現金決済" },
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
        </div>
      </div>
    </section>
  )
}
