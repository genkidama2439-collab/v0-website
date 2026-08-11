"use client"

import { useMemo } from "react"
import SunCalc from "suncalc"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Clock, Info } from "lucide-react"
import { DAY_SUP_TIMES, NIGHT_TOUR_TIMES } from "@/lib/plan-flags"
import { getSunsetSupGuide } from "@/lib/beach-info"

type PlanId = "night-hunter" | "sunset-sup" | "day-sup" | "slide-boat" | "other"

type Props = {
  selectedPlan: PlanId
  selectedDate: Date
  selectedTime: string
  onPick: (time: string) => void
}

// 宮古島の座標（市街地基準）
const MIYAKOJIMA = { lat: 24.805, lon: 125.281 }

function roundTo5Min(date: Date) {
  const d = new Date(date)
  const ms = 1000 * 60 * 5
  d.setTime(Math.round(d.getTime() / ms) * ms)
  return d
}

function toJSTString(date: Date) {
  return format(date, "HH:mm", { locale: ja })
}

function getSunsetSlots(date: Date) {
  const times = SunCalc.getTimes(date, MIYAKOJIMA.lat, MIYAKOJIMA.lon)
  const sunset = times.sunset
  const offsetsMin = [-90, -60, -30]
  const slots = offsetsMin
    .map((m) => {
      const d = new Date(sunset)
      d.setMinutes(d.getMinutes() + m)
      return roundTo5Min(d)
    })
    .filter((d) => {
      const h = d.getHours()
      return h >= 17 && h <= 19 && d.getMinutes() <= 55
    })
    .map(toJSTString)

  if (slots.length === 0) {
    return ["17:30", "18:00", "18:30"]
  }
  return Array.from(new Set(slots))
}

function getTimeSlots(plan: PlanId, date: Date): string[] {
  switch (plan) {
    case "night-hunter":
      return NIGHT_TOUR_TIMES
    case "sunset-sup":
      return getSunsetSlots(date)
    case "day-sup":
      return DAY_SUP_TIMES
    case "slide-boat":
      return ["09:00", "13:00"]
    default:
      return ["07:00", "09:00", "11:00", "14:00", "16:00"]
  }
}

export default function BookingTimeSlots({ selectedPlan, selectedDate, selectedTime, onPick }: Props) {
  const slots = useMemo(() => getTimeSlots(selectedPlan, selectedDate), [selectedPlan, selectedDate])

  if (selectedPlan === "sunset-sup") {
    // 日付が選択されていれば、その日の日没（SunCalc）とその月の集合・解散目安を表示する
    const hasValidDate = selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
    const dateGuide = hasValidDate
      ? {
          label: format(selectedDate, "M月d日", { locale: ja }),
          sunset: toJSTString(SunCalc.getTimes(selectedDate, MIYAKOJIMA.lat, MIYAKOJIMA.lon).sunset),
          ...getSunsetSupGuide(selectedDate.getMonth() + 1),
        }
      : null

    return (
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800 mb-2">サンセットSUP 時間について</h3>
            <p className="text-sm text-orange-700 mb-3">
              集合はその日の日没の約90分前です。正確な集合時間と集合場所は、当日の日没時刻と天候状況を考慮して前日にLINEでご案内いたします。
            </p>
            <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">集合時間・集合場所は前日にLINEでお知らせします</span>
              </div>
              {dateGuide ? (
                <ul className="text-xs text-orange-600 space-y-1">
                  <li>• {dateGuide.label}の日没：{dateGuide.sunset}頃</li>
                  <li>
                    • 集合目安：<span className="font-bold text-orange-800">{dateGuide.meet}頃</span>／解散目安：
                    <span className="font-bold text-orange-800">{dateGuide.end}頃</span>（約2時間・マジックアワーまで満喫）
                  </li>
                </ul>
              ) : (
                <ul className="text-xs text-orange-600 space-y-1">
                  <li>• 集合の目安：夏（6〜8月）17:45〜18:00頃／冬（11〜2月）16:30〜17:00頃</li>
                  <li>• ツアーは約2時間、日没の約30分後に解散（マジックアワーまで満喫）</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {slots.map((time) => (
          <Button
            key={time}
            type="button"
            variant={selectedTime === time ? "default" : "outline"}
            size="sm"
            onClick={() => onPick(time)}
            className={`rounded-xl ${
              selectedTime === time
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            {time}
          </Button>
        ))}
      </div>
      {selectedPlan === "day-sup" && (
        <p className="text-xs text-gray-500 mt-2">
          ※開始時間は当日の海況・水位により前後する場合があります（確定時間はLINEでご案内します）
        </p>
      )}
      {selectedPlan === "night-hunter" && (
        <p className="text-xs text-gray-500 mt-2">
          ※23:20便は翌日0:50頃の解散予定です。予約日は23:20に開始する日をお選びください。
        </p>
      )}
    </div>
  )
}
