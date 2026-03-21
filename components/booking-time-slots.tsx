"use client"

import { useMemo } from "react"
import SunCalc from "suncalc"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Clock, Info } from "lucide-react"

type PlanId = "night-hunter" | "sunset-sup" | "other"

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
      return ["19:30", "21:20"]
    case "sunset-sup":
      return getSunsetSlots(date)
    default:
      return ["07:00", "09:00", "11:00", "14:00", "16:00"]
  }
}

export default function BookingTimeSlots({ selectedPlan, selectedDate, selectedTime, onPick }: Props) {
  const slots = useMemo(() => getTimeSlots(selectedPlan, selectedDate), [selectedPlan, selectedDate])

  if (selectedPlan === "sunset-sup") {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-800 mb-2">サンセットSUP 時間について</h3>
            <p className="text-sm text-orange-700 mb-3">
              サンセットSUPの開始時間は、当日の日没時刻と天候状況を考慮して最適な時間を決定いたします。
            </p>
            <div className="bg-white/60 rounded-lg p-3 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">予約確定時にお知らせします</span>
              </div>
              <ul className="text-xs text-orange-600 space-y-1">
                <li>• 通常17:00〜19:00の間で開始</li>
                <li>• 日没30〜90分前の最適な時間</li>
                <li>{""}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
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
  )
}
