"use client"

import type React from "react"
import { ParticipantForm } from "./participant-form"

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

const S5_DURATION_OPTIONS = [
  { id: "5h", label: "スタンダード", hours: "5時間", price: 58000, note: "厳選4スポット" },
  { id: "7h", label: "ロングデイ", hours: "7時間", price: 75000, note: "5-6スポット＋寄り道多め" },
  { id: "9h", label: "プレミア", hours: "9時間", price: 85000, note: "サンセットまで" },
] as const

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

  const selectedPlanData = PLANS.find((plan) => plan.id === bookingData.selectedPlan)

  const getCurrentPrices = () => {
    if (!selectedPlanData) {
      return { adultPrice: ADULT_PRICE, childPrice: CHILD_PRICE }
    }

    if (selectedPlanData.id === "S5") {
      const durationOption = S5_DURATION_OPTIONS.find((opt) => opt.id === bookingData.selectedDuration)
      const basePrice = durationOption?.price || 58000
      return {
        adultPrice: basePrice,
        childPrice: basePrice,
      }
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
      let participantIndex = 0

      // Add adults
      for (let i = 0; i < adultCount; i++) {
        const existing = existingParticipants.find(
          (p) => p.category === "adult" && participantIndex < existingParticipants.length,
        )
        newParticipants.push(
          existing || {
            id: generateParticipantId("adult", i),
            name: "",
            age: "", // Changed from 0 to empty string to allow input
            height: "", // Changed from 0 to empty string to allow input
            weight: "", // Changed from 0 to empty string to allow input
            footSize: "", // Changed from 0 to empty string to allow input
            category: "adult",
          },
        )
        participantIndex++
      }

      // Add children
      for (let i = 0; i < childCount; i++) {
        const existing = existingParticipants.find(
          (p) => p.category === "child" && participantIndex < existingParticipants.length,
        )
        newParticipants.push(
          existing || {
            id: generateParticipantId("child", i),
            name: "",
            age: "", // Changed from 0 to empty string to allow input
            height: "", // Changed from 0 to empty string to allow input
            weight: "", // Changed from 0 to empty string to allow input
            footSize: "", // Changed from 0 to empty string to allow input
            category: "child",
          },
        )
        participantIndex++
      }

      // Add under-3
      for (let i = 0; i < under3Count; i++) {
        const existing = existingParticipants.find(
          (p) => p.category === "under3" && participantIndex < existingParticipants.length,
        )
        newParticipants.push(
          existing || {
            id: generateParticipantId("under3", i),
            name: "",
            age: "", // Changed from 0 to empty string to allow input
            height: "", // Changed from 0 to empty string to allow input
            weight: "", // Changed from 0 to empty string to allow input
            footSize: "", // Changed from 0 to empty string to allow input
            category: "under3",
          },
        )
        participantIndex++
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
    if (bookingData.selectedPlan === "S5") {
      // For S5, use the selected duration price as a flat group rate
      const durationOption = S5_DURATION_OPTIONS.find((opt) => opt.id === bookingData.selectedDuration)
      const groupPrice = durationOption?.price || 58000
      const staffFee = bookingData.selectedStaff ? STAFF_FEE : 0
      setTotalPrice(groupPrice + staffFee)
    } else {
      // For other plans, calculate per-person pricing
      const baseTotal = bookingData.adultCount * adultPrice + bookingData.childCount * childPrice

      const under3Price = bookingData.selectedPlan === "S3" ? 0 : childPrice
      const under3Total = bookingData.under3Count * under3Price

      const vipSurcharge = selectedPlanData?.vipSurcharge || 0

      const staffFee = bookingData.selectedStaff ? STAFF_FEE : 0

      setTotalPrice(baseTotal + under3Total + vipSurcharge + staffFee)
    }
  }, [
    bookingData.adultCount,
    bookingData.childCount,
    bookingData.under3Count,
    bookingData.selectedPlan,
    bookingData.selectedStaff,
    bookingData.selectedDuration,
    selectedPlanData,
    adultPrice,
    childPrice,
  ])

  const handleInputChange = (field: keyof BookingData, value: any) => {
    setBookingData((prev) => ({
      ...prev,
      [field]: value,
    }))
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
        }),
      })

      if (!response.ok) {
        throw new Error("予約の送信に失敗しました")
      }

      console.log("[v0] Booking submitted successfully")
      setIsSubmitted(true)
    } catch (error) {
      console.error("[v0] Booking submission error:", error)
      alert("予約の送信中にエラーが発生しました。もう一度お試しください。")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    bookingData.selectedPlan &&
    bookingData.selectedDate &&
    (getPlanType(bookingData.selectedPlan) === "sunset-sup" || bookingData.selectedTime) &&
    (bookingData.adultCount > 0 || bookingData.childCount > 0 || bookingData.under3Count > 0) &&
    bookingData.customerName &&
    bookingData.customerEmail &&
    bookingData.customerPhone &&
    bookingData.agreedToTerms &&
    bookingData.participants.every(
      (p) =>
        p.name.trim() !== "" &&
        typeof p.age === "number" &&
        p.age > 0 &&
        typeof p.height === "number" &&
        p.height > 0 &&
        typeof p.weight === "number" &&
        p.weight > 0 &&
        typeof p.footSize === "number" &&
        p.footSize > 0,
    )

  if (isSubmitted) {
    return (
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-emerald-800 mb-4">仮予約が完了しました！</h2>
          <p className="text-gray-600 mb-6">
            ご予約ありがとうございます。確認メールを送信いたしました。
            <br />
            24時間以内にスタッフよりご連絡いたします。
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
              {selectedPlanData?.vipSurcharge && (
                <p className="text-orange-600">貸切追加料金: ¥{selectedPlanData.vipSurcharge.toLocaleString()}</p>
              )}
              <p className="font-semibold text-emerald-800">合計金額: ¥{totalPrice.toLocaleString()}</p>
            </div>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            <a href="/">ホームに戻る</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
                      {plan.id === "S2" ? (
                        <div>
                          <div className="text-xl font-bold text-emerald-600">+¥20,000</div>
                          <div className="text-xs text-gray-500">貸切料金</div>
                        </div>
                      ) : plan.id === "S3" ? (
                        <div className="text-xl font-bold text-emerald-600">¥4,000</div>
                      ) : plan.id === "S5" ? (
                        <div className="text-xl font-bold text-emerald-600">¥58,000〜</div>
                      ) : (
                        <div className="text-xl font-bold text-emerald-600">¥6,000〜</div>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {selectedPlanData?.id === "S5" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3 text-sm">時間プランを選択してください</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {S5_DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleInputChange("selectedDuration", option.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      bookingData.selectedDuration === option.id
                        ? "border-blue-500 bg-blue-100 shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-gray-900">{option.label}</div>
                      {bookingData.selectedDuration === option.id && <Check className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{option.hours}</div>
                    <div className="text-lg font-bold text-blue-600">¥{option.price.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.note}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

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
                    ) : selectedPlanData.id === "S5" ? (
                      <>
                        ¥{adultPrice.toLocaleString()} ({bookingData.selectedDuration}プラン)
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
                3歳未満のお子様が参加できるのはナイトハンター試験のみとなります。
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
              {bookingData.selectedPlan === "S5" ? (
                <div className="flex justify-between">
                  <span>1組料金 ({bookingData.selectedDuration}プラン)</span>
                  <span>￥{adultPrice.toLocaleString()}</span>
                </div>
              ) : (
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
                  {selectedPlanData?.vipSurcharge && (
                    <div className="flex justify-between text-orange-600">
                      <span>貸切追加料金</span>
                      <span>￥{selectedPlanData.vipSurcharge.toLocaleString()}</span>
                    </div>
                  )}
                </>
              )}
              {bookingData.selectedStaff && (
                <div className="flex justify-between text-emerald-600">
                  <span>スタッフ指名料</span>
                  <span>￥{STAFF_FEE.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-lg text-emerald-800">
                <span>合計金額</span>
                <span>￥{totalPrice.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {bookingData.selectedPlan === "S5" ? (
                <>
                  ※1組6名様までの料金です
                  <br />
                  ※器材レンタル・保険料込み
                </>
              ) : (
                <>
                  {ageRestrictionMessage}
                  <br />
                  ※器材レンタル・保険料込み
                  {selectedPlanData?.vipSurcharge && (
                    <>
                      <br />
                      ※貸切プランは通常料金に追加で￥{selectedPlanData.vipSurcharge.toLocaleString()}
                      の貸切料金がかかります
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Participant Details */}
      <ParticipantForm participants={bookingData.participants} minAge={minAge} onUpdate={handleParticipantChange} />

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
            <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
              メールアドレス *
            </Label>
            <Input
              id="email"
              type="email"
              value={bookingData.customerEmail}
              onChange={(e) => handleInputChange("customerEmail", e.target.value)}
              placeholder="example@email.com"
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
