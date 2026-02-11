"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Award, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { STAFFS, BLUR_DATA_URLS } from "@/lib/data"

export function StaffGrid() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const getStaffIcon = (role: string) => {
    switch (role) {
      case "現場責任者":
        return <Shield className="w-6 h-6 text-emerald-600" />
      case "やまちゃんの右腕":
        return <Star className="w-6 h-6 text-blue-600" />
      case "ナイトツアー専門":
        return <Award className="w-6 h-6 text-purple-600" />
      case "ドローンパイロット":
        return <Award className="w-6 h-6 text-sky-600" />
      default:
        return <Award className="w-6 h-6 text-gray-600" />
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) {
              setCurrentIndex(index)
            }
          }
        })
      },
      {
        root: container,
        threshold: [0.5, 0.75, 1.0],
        rootMargin: "0px",
      },
    )

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToIndex = (index: number) => {
    const card = cardRefs.current[index]
    if (card && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardRect = card.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      // Calculate scroll position to center the card
      const scrollLeft = card.offsetLeft - (containerRect.width - cardRect.width) / 2

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      })
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < STAFFS.length - 1) {
      scrollToIndex(currentIndex + 1)
    }
  }

  return (
    <section className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-emerald-800 mb-4 text-balance">私たちのチーム</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
            海を愛し、お客様の安全と楽しさを第一に考える
            <br />
            プロフェッショナルなスタッフをご紹介します
          </p>
        </div>

        <div className="relative">
          {/* Mobile Side Navigation Buttons */}
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="前のスタッフ"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === STAFFS.length - 1}
            className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-emerald-100 text-emerald-600 hover:bg-white hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="次のスタッフ"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8 md:overflow-visible"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollSnapType: "x mandatory",
              overscrollBehaviorX: "contain",
              touchAction: "auto",
            }}
            role="region"
            aria-roledescription="carousel"
          >
            {STAFFS.map((staff, index) => (
              <div
                key={staff.id}
                ref={(el) => {
                  cardRefs.current[index] = el
                }}
                className="flex-none w-full px-4 snap-center md:w-auto md:px-0 md:snap-align-none"
                style={{
                  scrollSnapAlign: "center",
                  scrollSnapStop: "always",
                }}
              >
                <Card
                  className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg hover:shadow-2xl transition-all duration-300 group"
                  aria-current={index === currentIndex ? "true" : undefined}
                >
                  <CardContent className="p-0">
                    {/* Staff Image */}
                    <div className="relative h-64 overflow-hidden rounded-t-3xl">
                      <Image
                        src={staff.image || "/placeholder.svg"}
                        alt={staff.name}
                        width={320}
                        height={256}
                        quality={65}
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URLS.ocean}
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 320px, 280px"
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                          staff.name === "ひかる" ? "object-[center_30%]" : "object-top"
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                      {/* Role Badge */}
                      <Badge
                        className={`absolute top-4 left-4 ${
                          staff.role === "現場責任者"
                            ? "bg-emerald-600"
                            : staff.role === "やまちゃんの右腕"
                              ? "bg-blue-600"
                              : staff.role === "ナイトツアー専門"
                                ? "bg-purple-600"
                                : staff.role === "ドローンパイロット"
                                  ? "bg-sky-600"
                                  : "bg-gray-600"
                        } text-white`}
                      >
                        {staff.role}
                      </Badge>
                    </div>

                    {/* Staff Info */}
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {getStaffIcon(staff.role)}
                        <h3 className="text-xl font-bold text-emerald-800">{staff.name}</h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{staff.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Mobile Dot Indicators */}
          <div className="flex justify-center items-center mt-6 md:hidden">
            <div className="flex gap-2">
              {STAFFS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentIndex === index ? "bg-emerald-600 w-8" : "bg-emerald-200 w-2 hover:bg-emerald-300"
                  }`}
                  aria-label={`スタッフ ${index + 1} に移動`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Team Message */}
        <div className="mt-16">
          <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg max-w-4xl mx-auto">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4">チームからのメッセージ</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                私たち海亀兄弟のスタッフは、お客様に最高の海洋体験をお届けすることを使命としています。
                安全を第一に、一人ひとりのお客様に寄り添ったサービスを心がけ、
                宮古島の美しい海と海亀との出会いを通じて、一生の思い出を作るお手伝いをいたします。
                <br />
                <br />
                初心者の方から上級者の方まで、どなたでも安心してご参加いただけるよう、
                経験豊富なスタッフが丁寧にサポートいたします。 皆様のお越しを心よりお待ちしております。
              </p>
              <div className="text-emerald-800 font-semibold">海亀兄弟スタッフ一同</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
