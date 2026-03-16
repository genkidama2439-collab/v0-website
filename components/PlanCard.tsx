"use client"
import { formatPriceWithTilde, BLUR_DATA_URLS } from "@/lib/data"
import { dateToYMD } from "@/lib/date-utils"
import { Heart, ChevronDown, ExternalLink } from "lucide-react"
import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"

export default function PlanCard({ plan, priority = false }: { plan: any; priority?: boolean }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(0) // Index of selected duration

  const discountPercentage = 34
  const originalPrice = Math.round(plan.price * 1.5)

  const currentPrice = plan.flexibleDurations ? plan.flexibleDurations[selectedDuration].price : plan.price
  const currentNote = plan.flexibleDurations ? plan.flexibleDurations[selectedDuration].note : null

  const availableDates = useMemo(() => {
    const dates = []
    const today = new Date()
    const sixMonthsLater = new Date(today)
    sixMonthsLater.setMonth(today.getMonth() + 6)

    const daysToShow = Math.ceil((sixMonthsLater.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekday = ["日", "月", "火", "水", "木", "金", "土"][date.getDay()]
      dates.push({
        display: `${month}/${day}`,
        weekday,
        fullDate: dateToYMD(date),
      })
    }
    return dates
  }, [])

  return (
    <div className="w-full max-w-[360px] mx-auto overflow-x-hidden">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Top section: Image + Info */}
        <div className="flex gap-3 p-3">
          <div className="relative flex-shrink-0 w-[90px] h-[90px]">
            <Image
              src={
                plan.id === "S1"
                  ? "/images/s1-sea-turtle-snorkeling.jpg"
                  : plan.id === "S2"
                    ? "/images/s2-sea-turtle-closeup.jpg"
                    : plan.id === "S3"
                      ? "/images/night-hunter-crab.jpg"
                      : plan.id === "S4"
                        ? "/images/sunset-sup-silhouettes.jpg"
                        : plan.image || "/placeholder.svg"
              }
              alt={plan.name}
              width={90}
              height={90}
              quality={priority ? 75 : 60}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              fetchPriority={priority ? "high" : "auto"}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URLS.turtle}
              sizes="90px"
              className="w-full h-full object-cover rounded-md"
            />
            {/* </CHANGE> */}
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsFavorite(!isFavorite)
              }}
              className="absolute bottom-1.5 left-1.5 bg-white/95 backdrop-blur-sm rounded-full p-1 shadow-sm hover:bg-white transition-colors"
              aria-label="お気に入り"
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
            </button>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{plan.name}</h3>

            {plan.flexibleDurations && (
              <div className="flex gap-1 flex-wrap mb-1">
                {plan.flexibleDurations.map((duration: any, index: number) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault()
                      setSelectedDuration(index)
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-full transition-all ${
                      selectedDuration === index
                        ? "bg-emerald-500 text-white font-semibold"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <span className="text-yellow-500 text-sm leading-none">★</span>
              <span className="text-xs font-semibold text-gray-900">{plan.rating}</span>
              <span className="text-[10px] text-gray-500">({plan.reviewCount}件)</span>
            </div>

            <p className="text-[10px] text-gray-600">
              {plan.flexibleDurations ? "1組あたり" : `参加者（${plan.ageRange}）1人`}
            </p>

            <div className="flex items-end gap-2 mt-auto">
              {plan.flexibleDurations ? (
                <div className="flex flex-col">
                  <span className="text-base font-bold text-red-600 leading-tight">
                    ¥{currentPrice.toLocaleString()}
                  </span>
                  {currentNote && <span className="text-[9px] text-gray-500 leading-tight">{currentNote}</span>}
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 line-through leading-tight">
                    ¥{originalPrice.toLocaleString()}
                  </span>
                  <span className="text-base font-bold text-red-600 leading-tight">
                    {formatPriceWithTilde({ price: plan.price, childPrice: plan.childPrice })}
                  </span>
                </div>
              )}
              {plan.id !== "S2" && !plan.flexibleDurations && (
                <span className="text-[10px] font-bold text-red-600 border border-red-600 rounded px-1.5 py-0.5 whitespace-nowrap mb-0.5">
                  {discountPercentage}% OFF!!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle section: Supplementary info */}
        <div className="px-3 pb-2 space-y-0.5">
          {!plan.flexibleDurations && (
            <>
              <p className="text-[10px] text-gray-500">体験料、消費税、器材レンタル、写真データ 込み</p>
              <p className="text-[10px] text-blue-600 font-medium">体験の前日までキャンセル無料！</p>
            </>
          )}
          <p className="text-[10px] text-gray-500">
            <span className="font-medium">開催時間：</span>
            {plan.timeTags?.slice(0, 4).join(" / ")}
            {plan.timeTags?.length > 4 && " ..."}
          </p>
        </div>

        {!plan.flexibleDurations && (
          <div className="px-3 pb-3">
            <p className="text-[11px] font-semibold text-gray-700 mb-2">予約可能日</p>
            <div className="overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollSnapType: "x mandatory" }}>
              <div className="flex gap-2 pb-1">
                {availableDates.map((date) => (
                  <button
                    key={date.fullDate}
                    onClick={() => setSelectedDate(selectedDate === date.fullDate ? null : date.fullDate)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-[70px] h-14 rounded-full border-2 transition-all ${
                      selectedDate === date.fullDate
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-gray-200 text-gray-700 hover:border-emerald-300"
                    }`}
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <span className="text-[9px] leading-none">{date.weekday}</span>
                    <span className="text-xs font-bold leading-none mt-0.5">{date.display}</span>
                  </button>
                ))}
              </div>
            </div>

            <Link href={`/book?plan=${plan.id}&date=${selectedDate}`}>
              <button
                className={`w-full mt-3 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                  selectedDate
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!selectedDate}
              >
                {selectedDate ? "選択した日付を予約する" : "日付を選択してください"}
              </button>
            </Link>

            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full mt-2 py-2 rounded-lg font-medium text-sm text-emerald-600 border border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1"
            >
              {isDetailsOpen ? "詳細を閉じる" : "詳細を見る"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {plan.flexibleDurations && (
          <div className="px-3 pb-3">
            <a
              href={plan.lineConsultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 py-2.5 rounded-lg font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
            >
              LINEで相談する
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full mt-2 py-2 rounded-lg font-medium text-sm text-emerald-600 border border-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1"
            >
              {isDetailsOpen ? "詳細を閉じる" : "詳細を見る"}
              <ChevronDown className={`w-4 h-4 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {isDetailsOpen && (
          <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3 animate-in slide-in-from-top-2">
            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">プラン詳細</h4>
              <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{plan.description}</p>
            </div>

            {/* Features */}
            {plan.features && plan.features.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">特徴</h4>
                <div className="flex flex-wrap gap-1.5">
                  {plan.features.map((feature: string, index: number) => (
                    <span key={index} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">所要時間</h4>
              <p className="text-[11px] text-gray-700">{plan.durationHours}時間</p>
            </div>

            {/* What to bring */}
            {plan.whatToBring && plan.whatToBring.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">持ち物</h4>
                <ul className="text-[11px] text-gray-700 space-y-0.5">
                  {plan.whatToBring.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meeting location */}
            {plan.location && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">集合場所</h4>
                <p className="text-[11px] text-gray-700">
                  {typeof plan.location === "string" ? plan.location : plan.location.default}
                </p>
                {typeof plan.location === "object" && plan.location.northWind && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    ※北風時: {plan.location.northWind} / 南風時: {plan.location.southWind}
                  </p>
                )}
              </div>
            )}

            {/* Meeting time */}
            {plan.meetingTime && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">集合時間</h4>
                <p className="text-[11px] text-gray-700">{plan.meetingTime.regular}</p>
                {plan.meetingTime.early && <p className="text-[10px] text-gray-500 mt-0.5">{plan.meetingTime.early}</p>}
              </div>
            )}

            {/* Options */}
            {plan.options && plan.options.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">オプション</h4>
                <ul className="text-[11px] text-gray-700 space-y-1">
                  {plan.options.map((option: any, index: number) => (
                    <li key={index} className="flex justify-between items-center">
                      <span>{option.name}</span>
                      <span className="text-emerald-600 font-medium">
                        ¥{option.price.toLocaleString()}
                        {option.freeForPrivate && (
                          <span className="text-gray-500 text-[10px] ml-1">（貸切時無料）</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Precautions */}
            {plan.precautions && plan.precautions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">注意事項</h4>
                <ul className="text-[11px] text-gray-700 space-y-0.5">
                  {plan.precautions.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment method */}
            {plan.paymentMethod && (
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-1">支払い方法</h4>
                <p className="text-[11px] text-gray-700">{plan.paymentMethod}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
