"use client"

import type React from "react"
import { ParticipantForm } from "./participant-form"
import { useLiff } from "./liff-provider"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Calculator, Star, CheckCircle, UserCheck, Check } from "lucide-react"
import { PLANS, STAFF_FEE } from "@/lib/data"
import { todayStr, localDateFromYMD } from "@/lib/date-utils"
import BookingTimeSlots from "@/components/booking-time-slots"

interface ParticipantDetails {
  id: string // Added unique ID for each participant
  name: string
  age: number | ""
  height: number | ""
  weight: number | ""
  footSize: number | ""
  category: "adult" | "child" | "under3"
}

interface BookingData {
  selectedPlan: string
  selectedDate: string
  selectedTime: string
  adultCount: number
  childCount: number
  under3Count: number
  participants: ParticipantDetails[]
  selectedStaff: string
  selectedDuration: "5h" | "7h" | "9h"
  customerName: string
  customerEmail: string
  customerPhone: string
  specialRequests: string
  agreedToTerms: boolean
  couponCode: string
  couponDiscount: number
  lineUserId: string | null
  lineDisplayName: string | null
}

const ADULT_PRICE = 6000 // Declare ADULT_PRICE variable
const CHILD_PRICE = 6000 // Declare CHILD_PRICE variable

function getPlanType(planId: string): "night-hunter" | "sunset-sup" | "other" {
  switch (planId) {
    case "S3":
      return "night-hunter"
    case "S4":
      return "sunset-sup"
    default:
      return "other"
  }
}

function generateParticipantId(category: string, index: number): string {
  return `${category}-${index}-${Date.now()}`
}

const STAFF_LIST = [
  { id: "", name: "指名なし" },
  { id: "staff1", name: "やまちゃん" },
  { id: "staff2", name: "ひかる" },
  { id: "staff3", name: "そういちろう" },
  { id: "staff4", name: "凪" },
]

export function BookingForm() {
  const searchParams = useSearchParams()
  const hasInitialized = useRef(false)

  const [bookingData, setBookingData] = useState<BookingData>({
    selectedPlan: "",
    selectedDate: "",
    selectedTime: "",
    adultCount: 0,
    childCount: 0,
    under3Count: 0,
    participants: [],
    selectedStaff: "",
    selectedDuration: "5h",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialRequests: "",
    agreedToTerms: false,
    couponCode: "",
    couponDiscount: 0,
    lineUserId: null,
    lineDisplayName: null,
  })

  const [totalPrice, setTotalPrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (hasInitialized.current) return

    const planParam = searchParams?.get("plan")
    const dateParam = searchParams?.get("date")

    if (planParam || dateParam) {
      hasInitialized.current = true
      setBookingData((prev) => ({
        ...prev,
        ...(planParam && { selectedPlan: planParam }),
        ...(dateParam && { selectedDate: dateParam }),
      }))
    }
  }, [searchParams])

  // LIFFコンテキストからlineUserIdを取得
  const { lineUserId: liffUserId, lineDisplayName: liffDisplayName, isLiffReady, liffError } = useLiff()

  useEffect(() => {
    if (liffUserId) {
      setBookingData((prev) => ({ ...prev, lineUserId: liffUserId, lineDisplayName: liffDisplayName }))
    }
  }, [liffUserId, liffDisplayName])

  const selectedPlanData = PLANS.find((plan) => plan.id === bookingData.selectedPlan)

  const getCurrentPrices = () => {
    if (!selectedPlanData) {
      return { adultPrice: ADULT_PRICE, childPrice: CHILD_PRICE }
    }

    return {
      adultPrice: selectedPlanData.price,
      childPrice: selectedPlanData.childPrice || selectedPlanData.price,
    }
  }

  const { adultPrice, childPrice } = getCurrentPrices()

  const getAgeCategories = () => {
    const isNightHunter = bookingData.selectedPlan === "S3"

    return {
      childLabel: isNightHunter ? "子ども（4-12歳）" : "子ども（5-12歳）",
      minAge: isNightHunter ? 4 : 5,
      showUnder3: isNightHunter,
      ageRestrictionMessage: isNightHunter ? "※3歳未満は無料（保護者同伴必須）" : "※5歳未満のお子様は参加できません",
    }
  }

  const { childLabel, minAge, showUnder3, ageRestrictionMessage } = getAgeCategories()

  const createParticipants = useCallback(
    (adultCount: number, childCount: number, under3Count: number, existingParticipants: ParticipantDetails[]) => {
      const newParticipants: ParticipantDetails[] = []

      const existingAdults = existingParticipants.filter((p) => p.category === "adult")
      const existingChildren = existingParticipants.filter((p) => p.category === "child")
      const existingUnder3 = existingParticipants.filter((p) => p.category === "under3")

      // Add adults
      for (let i = 0; i < adultCount; i++) {
        const existing = existingAdults[i]
        newParticipants.push(
          existing || {
            id: generateParticipantId("adult", i),
            name: "",
            age: "",
            height: "",
            weight: "",
            footSize: "",
            category: "adult",
          },
        )
      }

      // Add children
      for (let i = 0; i < childCount; i++) {
        const existing = existingChildren[i]
        newParticipants.push(
          existing || {
            id: generateParticipantId("child", i),
            name: "",
            age: "",
            height: "",
            weight: "",
            footSize: "",
            category: "child",
          },
        )
      }

      // Add under-3
      for (let i = 0; i < under3Count; i++) {
        const existing = existingUnder3[i]
        newParticipants.push(
          existing || {
            id: generateParticipantId("under3", i),
            name: "",
            age: "",
            height: "",
            weight: "",
            footSize: "",
            category: "under3",
          },
        )
      }

      return newParticipants
    },
    [],
  )

  useEffect(() => {
    const totalParticipants = bookingData.adultCount + bookingData.childCount + bookingData.under3Count
    const currentParticipants = bookingData.participants.length

    if (totalParticipants !== currentParticipants) {
      const newParticipants = createParticipants(
        bookingData.adultCount,
        bookingData.childCount,
        bookingData.under3Count,
        bookingData.participants,
      )

      setBookingData((prev) => ({
        ...prev,
        participants: newParticipants,
      }))
    }
  }, [bookingData.adultCount, bookingData.childCount, bookingData.under3Count, createParticipants])

  useEffect(() => {
    // Calculate per-person pricing for all plans
    const baseTotal = bookingData.adultCount * adultPrice + bookingData.childCount * childPrice

    const under3Price = bookingData.selectedPlan === "S3" ? 0 : childPrice
    const under3Total = bookingData.under3Count * under3Price

    const vipSurcharge = selectedPlanData?.vipSurcharge || 0

    const staffFee = bookingData.selectedStaff ? STAFF_FEE : 0

    setTotalPrice(baseTotal + under3Total + vipSurcharge + staffFee - bookingData.couponDiscount)
  }, [
    bookingData.adultCount,
    bookingData.childCount,
    bookingData.under3Count,
    bookingData.selectedPlan,
    bookingData.selectedStaff,
    bookingData.couponDiscount,
    selectedPlanData,
    adultPrice,
    childPrice,
  ])

  const handleInputChange = (field: keyof BookingData, value: any) => {
    console.log("[v0] handleInputChange:", field, value)
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const COUPON_LIST: Record<string, number> = {
    "UMIGAME500": 500,
    "カメハメハ": 1000,
  }

  const handleCouponApply = () => {
    const totalPeople = bookingData.adultCount + bookingData.childCount
    const discountPerPerson = COUPON_LIST[bookingData.couponCode]
    if (discountPerPerson) {
      const discount = totalPeople * discountPerPerson
      setBookingData((prev) => ({ ...prev, couponDiscount: discount }))
    } else {
      setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
      alert("クーポンコードが正しくありません")
    }
  }

  const handleParticipantChange = (participantId: string, field: keyof ParticipantDetails, value: any) => {
    setBookingData((prev) => ({
      ...prev,
      participants: prev.participants.map((participant) =>
        participant.id === participantId ? { ...participant, [field]: value } : participant,
      ),
    }))
  }

  const handleCountChange = (field: "adultCount" | "childCount" | "under3Count", increment: boolean) => {
    const isVip = bookingData.selectedPlan === "S2"
    const maxParticipants = isVip ? 6 : 999
    const currentTotal = bookingData.adultCount + bookingData.childCount

    if (increment && isVip && currentTotal >= maxParticipants) return

    setBookingData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingData,
          planName: selectedPlanData?.name,
          staffName: STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name,
          adultPrice,
          childPrice,
          vipSurcharge: selectedPlanData?.vipSurcharge || 0,
          totalPrice,
          couponCode: bookingData.couponCode,
          couponDiscount: bookingData.couponDiscount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `エラーが発生しました（ステータス: ${response.status}）`
        console.error("[v0] Booking API error:", { status: response.status, error: errorData })
        throw new Error(errorMessage)
      }

      // fetch が成功したら即座に完了と判断（response.json は無視）
      console.log("[v0] Booking submitted successfully, status:", response.status)
      setIsSubmitted(true)
      setIsSubmitting(false)
    } catch (error) {
      console.error("[v0] Booking submission error:", error)
      const errorMessage = error instanceof Error ? error.message : "予約の送信中にエラーが発生しました。もう一度お試しください。"
      alert(errorMessage)
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    bookingData.selectedPlan &&
    bookingData.selectedDate &&
    (getPlanType(bookingData.selectedPlan) === "sunset-sup" || bookingData.selectedTime) &&
    (bookingData.adultCount > 0 || bookingData.childCount > 0 || bookingData.under3Count > 0) &&
    bookingData.customerName &&
    bookingData.customerPhone &&
    bookingData.agreedToTerms &&
    bookingData.participants.every((p) => {
      // Check required fields for all participants
      if (p.name.trim() === "" || typeof p.age !== "number" || p.age <= 0) {
        return false
      }

      // For night tour (S3 or night-hunter), height, weight, and footSize are optional
      const isNightTour = bookingData.selectedPlan === "S3" || bookingData.selectedPlan === "night-hunter"

      if (isNightTour) {
        // Night tour: these fields are optional, but if provided, must be valid
        return true
      } else {
        // Other plans: height, weight, and footSize are required
        return (
          typeof p.height === "number" &&
          p.height > 0 &&
          typeof p.weight === "number" &&
          p.weight > 0 &&
          typeof p.footSize === "number" &&
          p.footSize > 0
        )
      }
    })

  if (isSubmitted) {
    return (
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">予約リクエストを受け付けました！</h2>
          <p className="text-gray-600 mb-6">
            ご予約ありがとうございます。
            <br />
            スタッフが内容を確認し、LINE公式アカウントから確定のご連絡をお送りします。
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-emerald-800 mb-2">予約内容</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>プラン: {selectedPlanData?.name}</p>
              <p>
                日時: {bookingData.selectedDate}{" "}
                {getPlanType(bookingData.selectedPlan) === "sunset-sup"
                  ? "(時間は後日ご連絡)"
                  : bookingData.selectedTime}
              </p>
              <p>
                人数: 大人{bookingData.adultCount}名 子ども{bookingData.childCount}名
                {bookingData.under3Count > 0 && ` 3歳未満${bookingData.under3Count}名`}
              </p>
              {bookingData.selectedStaff && (
                <p className="text-emerald-600">
                  スタッフ指名: {STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name} (+¥
                  {STAFF_FEE.toLocaleString()})
                </p>
              )}
              {selectedPlanData?.vipSurcharge > 0 && (
                <p className="text-orange-600">貸切追加料金: ¥{selectedPlanData.vipSurcharge.toLocaleString()}</p>
              )}
              <p className="font-semibold text-emerald-800">合計金額: ¥{totalPrice.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              予約の確定・変更・キャンセルはすべてLINEのトーク画面からご連絡いただけます。
            </p>
          </div>
          {bookingData.lineUserId ? (
            <Button
              onClick={() => { if (typeof window !== 'undefined' && window.liff) window.liff.closeWindow() }}
              className="bg-[#06C755] hover:bg-[#05b34d] text-white rounded-xl w-full"
            >
              LINEに戻る
            </Button>
          ) : (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <a href="/">ホームに戻る</a>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* DEBUGパネル - 確認後削除 */}
      <div className="text-xs bg-gray-100 rounded p-2 font-mono space-y-1">
        <p>LIFF Ready: {isLiffReady ? '✅' : '⏳'}</p>
        <p>LIFF ID: {process.env.NEXT_PUBLIC_LIFF_ID ?? '❌未設定'}</p>
        <p>LINE ID: {liffUserId ?? '未取得'}</p>
        <p>Error: {liffError ?? 'なし'}</p>
        <p>URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
      </div>
      {/* Plan Selection */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Star className="w-5 h-5" />
            プラン選択
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">ご希望のプランを選択してください</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PLANS.sort((a, b) => (a.rank || 999) - (b.rank || 999)).map((plan) => (
              <label
                key={plan.id}
                className={`block cursor-pointer transition-all duration-200 ${
                  bookingData.selectedPlan === plan.id ? "scale-[1.02]" : "hover:scale-[1.01]"
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={plan.id}
                  checked={bookingData.selectedPlan === plan.id}
                  onChange={(e) => handleInputChange("selectedPlan", e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    bookingData.selectedPlan === plan.id
                      ? "border-emerald-500 bg-emerald-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md"
                  }`}
                >
                  {/* Selected indicator */}
                  {bookingData.selectedPlan === plan.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-1">{plan.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {plan.durationHours}時間
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          {plan.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {plan.id === "S3" ? (
                        <div className="text-xl font-bold text-emerald-600">¥4,000</div>
                      ) : plan.id === "S5" ? (
                        <div className="text-xl font-bold text-emerald-600">¥58,000〜</div>
                      ) : (
                        <div className="text-xl font-bold text-emerald-600">
                          ¥{plan.price.toLocaleString()}{plan.id !== "S2" && "〜"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedPlanData && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <h4 className="font-semibold text-emerald-800 mb-2 text-sm">プラン詳細</h4>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{selectedPlanData.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/60 rounded-lg p-2">
                  <div className="text-gray-600 mb-0.5">対象年齢</div>
                  <div className="font-semibold text-gray-800">{selectedPlanData.ageRange}</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <div className="text-gray-600 mb-0.5">料金</div>
                  <div className="font-semibold text-gray-800">
                    {selectedPlanData.id === "S3" ? (
                      <>
                        ¥{selectedPlanData.price.toLocaleString()}{" "}
                        <span className="text-emerald-600">(3歳以下無料)</span>
                      </>
                    ) : (
                      <>大人¥{selectedPlanData.price.toLocaleString()}</>
                    )}
                  </div>
                </div>
              </div>

              {selectedPlanData.features && selectedPlanData.features.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlanData.features.slice(0, 3).map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-white/80 text-emerald-700 border border-emerald-200"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date and Time Selection */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Calendar className="w-5 h-5" />
            日時選択
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 mb-2 block">
              希望日
            </Label>
            <Input
              id="date"
              type="date"
              value={bookingData.selectedDate}
              onChange={(e) => {
                handleInputChange("selectedDate", e.target.value)
              }}
              min={todayStr()}
              className="rounded-xl border-emerald-200 focus:border-emerald-500"
            />
            {bookingData.selectedDate && (
              <p className="text-xs text-emerald-600 mt-1">選択中: {bookingData.selectedDate}</p>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">開始時間</Label>
            {bookingData.selectedDate && bookingData.selectedPlan ? (
              <BookingTimeSlots
                selectedPlan={getPlanType(bookingData.selectedPlan)}
                selectedDate={localDateFromYMD(bookingData.selectedDate)}
                selectedTime={bookingData.selectedTime}
                onPick={(time) => handleInputChange("selectedTime", time)}
              />
            ) : (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">プランと日付を選択してください</div>
            )}
            {selectedPlanData && getPlanType(bookingData.selectedPlan) !== "sunset-sup" && (
              <p className="text-xs text-gray-500 mt-2">
                選択中のプラン「{selectedPlanData.name}」の利用可能時間が表示されています
                {getPlanType(bookingData.selectedPlan) === "night-hunter" && (
                  <span className="text-purple-600"> (夜間限定)</span>
                )}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participant Count */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <Users className="w-5 h-5" />
            参加人数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {bookingData.selectedPlan && bookingData.selectedPlan !== "S3" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>年齢制限:</strong> このプランは5歳以上のお客様が対象です。
                3歳未満のお子様が参加できるのは【アマゾン帰りの男と行く】本格ナイトツアーのみとなります。
              </p>
            </div>
          )}

          {bookingData.selectedPlan === "S2" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>VIP貸切プランについて：</strong><br />
                • 料金：¥9,000 / 1名<br />
                • 最大6名まで承ります<br />
                • 7名以上の場合はLINEよりご相談ください
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Adult Count */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                大人（13歳以上）
                <span className="text-emerald-600 ml-2">￥{adultPrice.toLocaleString()}/人</span>
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCountChange("adultCount", false)}
                  disabled={bookingData.adultCount <= 0}
                  className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-emerald-800 w-12 text-center">{bookingData.adultCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCountChange("adultCount", true)}
                  className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Child Count */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                {childLabel}
                <span className="text-emerald-600 ml-2">￥{childPrice.toLocaleString()}/人</span>
              </Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCountChange("childCount", false)}
                  disabled={bookingData.childCount <= 0}
                  className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  -
                </Button>
                <span className="text-2xl font-bold text-emerald-800 w-12 text-center">{bookingData.childCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCountChange("childCount", true)}
                  className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  +
                </Button>
              </div>
            </div>

            {/* Under-3 Count - Only show for Night Hunter Test */}
            {showUnder3 && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  3歳未満
                  <span className="text-emerald-600 ml-2">無料</span>
                </Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCountChange("under3Count", false)}
                    disabled={bookingData.under3Count <= 0}
                    className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold text-emerald-800 w-12 text-center">
                    {bookingData.under3Count}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCountChange("under3Count", true)}
                    className="rounded-full w-10 h-10 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    +
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price Calculation */}
          <div className="bg-emerald-50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">料金計算</h3>
            </div>
            <div className="space-y-2 text-sm">
              <>
                {bookingData.adultCount > 0 && (
                  <div className="flex justify-between">
                    <span>
                      大人 {bookingData.adultCount}名 × ￥{adultPrice.toLocaleString()}
                    </span>
                    <span>￥{(bookingData.adultCount * adultPrice).toLocaleString()}</span>
                  </div>
                )}
                {bookingData.childCount > 0 && (
                  <div className="flex justify-between">
                    <span>
                      子ども {bookingData.childCount}名 × ￥{childPrice.toLocaleString()}
                    </span>
                    <span>￥{(bookingData.childCount * childPrice).toLocaleString()}</span>
                  </div>
                )}
                {bookingData.under3Count > 0 && (
                  <div className="flex justify-between">
                    <span>
                      3歳未満 {bookingData.under3Count}名 ×{" "}
                      {bookingData.selectedPlan === "S3" ? "無料" : `￥${childPrice.toLocaleString()}`}
                    </span>
                    <span>
                      {bookingData.selectedPlan === "S3"
                        ? "￥0"
                        : `￥${(bookingData.under3Count * childPrice).toLocaleString()}`}
                    </span>
                  </div>
                )}
                {selectedPlanData?.vipSurcharge > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>貸切追加料金</span>
                    <span>￥{selectedPlanData.vipSurcharge.toLocaleString()}</span>
                  </div>
                )}
              </>
              {bookingData.selectedStaff && (
                <div className="flex justify-between text-emerald-600">
                  <span>スタッフ指名料</span>
                  <span>￥{STAFF_FEE.toLocaleString()}</span>
                </div>
              )}
              {bookingData.couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>🎉 LINEクーポン割引</span>
                  <span>-￥{bookingData.couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-lg text-emerald-800">
                <span>合計金額</span>
                <span>￥{totalPrice.toLocaleString()}</span>
              </div>

              {/* クーポンコード */}
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  クーポンコード
                </p>
                <div className="flex gap-2">
                  <Input
                    value={bookingData.couponCode}
                    onChange={(e) => handleInputChange("couponCode", e.target.value)}
                    className="rounded-xl border-emerald-200 focus:border-emerald-500"
                  />
                  <Button
                    type="button"
                    onClick={handleCouponApply}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4"
                  >
                    適用
                  </Button>
                </div>
                {bookingData.couponDiscount > 0 && (
                  <p className="text-emerald-600 text-sm font-semibold mt-2">
                    🎉 クーポン適用済み！ -{bookingData.couponDiscount.toLocaleString()}円引き
                  </p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <>
                {ageRestrictionMessage}
                <br />
                ※器材レンタル・保険料込み
                {selectedPlanData?.vipSurcharge > 0 && (
                  <>
                    <br />
                    ※貸切プランは通常料金に追加で￥{selectedPlanData.vipSurcharge.toLocaleString()}
                    の貸切料金がかかります
                  </>
                )}
              </>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Participant Details */}
      <ParticipantForm participants={bookingData.participants} minAge={minAge} selectedPlan={bookingData.selectedPlan} onUpdate={handleParticipantChange} />

      {/* Customer Information */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-emerald-800">お客様情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
              代表者氏名 *
            </Label>
            <Input
              id="name"
              value={bookingData.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              placeholder="山田 太郎"
              className="rounded-xl border-emerald-200 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
              電話番号 *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={bookingData.customerPhone}
              onChange={(e) => handleInputChange("customerPhone", e.target.value)}
              placeholder="090-1234-5678"
              className="rounded-xl border-emerald-200 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <Label htmlFor="requests" className="text-sm font-medium text-gray-700 mb-2 block">
              特別なご要望・アレルギー等
            </Label>
            <Textarea
              id="requests"
              value={bookingData.specialRequests}
              onChange={(e) => handleInputChange("specialRequests", e.target.value)}
              placeholder="何かご要望がございましたらお書きください"
              className="rounded-xl border-emerald-200 focus:border-emerald-500"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Selection */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-800">
            <UserCheck className="w-5 h-5" />
            スタッフ指名（オプション）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>スタッフ指名について:</strong>
              <br />• お好みのスタッフを指名できます（追加料金: ¥{STAFF_FEE.toLocaleString()}）
              <br />• 指名は任意です。指名なしでも素晴らしい体験をお約束します
              <br />• スタッフの都合により、ご希望に添えない場合がございます
            </p>
          </div>

          <div>
            <Label htmlFor="staff" className="text-sm font-medium text-gray-700 mb-2 block">
              スタッフ選択
            </Label>
            <select
              id="staff"
              value={bookingData.selectedStaff}
              onChange={(e) => handleInputChange("selectedStaff", e.target.value)}
              className="w-full rounded-xl border-2 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 px-4 py-3 text-gray-700 bg-white transition-all"
            >
              {STAFF_LIST.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                  {staff.id && ` (+¥${STAFF_FEE.toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>

          {bookingData.selectedStaff && (
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                <strong>{STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name}</strong>を指名しました
                <br />
                <span className="text-emerald-600">指名料金: ¥{STAFF_FEE.toLocaleString()}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terms and Submit */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <Checkbox
              id="terms"
              checked={bookingData.agreedToTerms}
              onCheckedChange={(checked) => handleInputChange("agreedToTerms", checked)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              利用規約・キャンセルポリシーに同意します。
              <br />
              <span className="text-xs text-gray-500">
                ※前日と当日のキャンセルは100%のキャンセル料が発生します。
                <br />
                ※悪天候による中止の場合は全額返金いたします。
              </span>
            </Label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 text-lg font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "送信中..." : "仮予約を送信する"}
          </Button>

          <p className="text-xs text-gray-500 text-center mt-3">送信後、24時間以内にスタッフよりご連絡いたします。</p>
        </CardContent>
      </Card>
    </form>
  )
}
