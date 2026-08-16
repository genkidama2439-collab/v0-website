"use client"

import type React from "react"
import Link from "next/link"
import { ParticipantForm } from "./participant-form"
import { useLiff } from "./liff-provider"
import { categorizeBookingFailure, trackEvent } from "@/lib/analytics"
import { sendDetailedEvent } from "@/lib/detailed-analytics"
import { getAttribution, getAttributionSourceLabel } from "@/lib/attribution"
import {
  TRACKING_CONSENT_EVENT,
  completeCustomerBookingFunnel,
  getBookingCustomerAnalytics,
  hasTrackingConsent,
} from "@/lib/customer-tracking"
import {
  claimOnce,
  daysUntilDate,
  isLineLoginRedirectInProgress,
  toBookingFailureStage,
  toBookingTiming,
  trackBookingAbandoned,
  beginBookingFunnelSession,
  trackBookingFormView,
  trackBookingStarted as trackBookingStartedEvent,
  trackDateSelected,
  trackLineLoginClick,
  trackLineLoginSucceeded,
  trackParticipantDetailsCompleted,
  trackParticipantDetailsStarted,
  trackParticipantsCompleted,
  trackPlanSelected,
  trackPriceConfirmed,
  trackRepresentativeCompleted,
  trackSubmitClicked,
  trackTimeSelected,
  trackValidationError,
  type BookingStage,
  type FirstInteractionType,
  type FormRestoreResult,
  type MissingFieldCategory,
} from "@/lib/booking-funnel"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Calendar, Clock, Users, Calculator, CheckCircle, UserCheck, Check } from "lucide-react"
import { todayStr, localDateFromYMD } from "@/lib/date-utils"
import BookingTimeSlots from "@/components/booking-time-slots"
import { ComingSoonBadge } from "@/components/coming-soon"
import { ADULT_PRICE, BOOKING_PLANS, CHILD_PRICE } from "@/lib/booking-plans"
import { getStaffFee } from "@/lib/data"
import { getPlanPriceDisplay, getPlanCode } from "@/lib/plan-price-display"
import { getPlanMaxParticipants } from "@/lib/booking-rules"
import {
  clearBookingSubmissionId,
  getOrCreateBookingSubmissionId,
} from "@/lib/booking-submission"
import {
  calculateRentalTotal,
  getRentalCounts,
  getRentalUnitPrice,
  planOffersRentals,
} from "@/lib/rental-options"
import {
  COMBO_TURTLE_TIMES,
  COMBO_NIGHT_TIMES,
  DAY_SUP_TIME_NOTE,
  SENIOR_RESTRICTED_PLAN_IDS,
  getPrivateCounterpartName,
  isComboPlan as isComboPlanId,
  isTripleComboPlan as isTripleComboPlanId,
  planHasSup,
  planHasNight,
  getComboContentText,
  isParticipantAgeValid,
  isOverParticipantAgeLimit,
  getAdultAgeMax,
} from "@/lib/plan-flags"

// 予約確定の連絡はLINE公式アカウントからのプッシュ通知で届く。
// プッシュは「友だち追加」済みでないと届かないため、完了画面・送信前に友だち追加を促す。
const LINE_ADD_FRIEND_URL = "https://lin.ee/jfp4laz"

interface ParticipantDetails {
  id: string // Added unique ID for each participant
  name: string
  age: number | ""
  height: number | ""
  weight: number | ""
  footSize: number | ""
  category: "adult" | "child" | "under3"
  wetsuitRental: boolean
  prescriptionMaskRental: boolean
}

interface BookingData {
  selectedPlan: string
  selectedDate: string
  selectedTime: string
  nightTime: string
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
}

// LINEログイン（liff.login）はページリダイレクトを挟むため、入力途中の内容を
// sessionStorage に退避してログイン後に復元する。LINEの本人情報とID tokenは
// LIFFから毎回取得し、この下書きには含めない。
const BOOKING_DRAFT_KEY = "booking-form-draft"

function loadBookingDraft(): Partial<BookingData> | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as Partial<BookingData>) : null
  } catch {
    return null
  }
}

function saveBookingDraft(data: BookingData): void {
  try {
    window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(data))
  } catch {}
}

function clearBookingDraft(): void {
  try {
    window.sessionStorage.removeItem(BOOKING_DRAFT_KEY)
  } catch {}
}

// LINEログインの往復で下書きが戻ったかを判定するための「埋まっていた項目数」。
// 分析へ送るのは fully/partially/not_restored の区分だけで、入力値も項目名も保存しない。
const RESTORE_PROBE_KEY = "booking-form-restore-probe"

function countFilledFields(data: BookingData): number {
  const flags = [
    !!data.selectedPlan,
    !!data.selectedDate,
    !!data.selectedTime,
    !!data.nightTime,
    data.adultCount > 0,
    data.childCount > 0,
    data.under3Count > 0,
    !!data.selectedStaff,
    !!data.customerName,
    !!data.customerEmail,
    !!data.customerPhone,
    !!data.specialRequests,
    data.agreedToTerms,
    data.participants.some((participant) => typeof participant.age === "number"),
    data.participants.some((participant) => typeof participant.footSize === "number"),
  ]
  return flags.filter(Boolean).length
}

function saveRestoreProbe(data: BookingData): void {
  try {
    window.sessionStorage.setItem(RESTORE_PROBE_KEY, String(countFilledFields(data)))
  } catch {}
}

function readRestoreProbeResult(data: BookingData): FormRestoreResult {
  let before = Number.NaN
  try {
    before = Number(window.sessionStorage.getItem(RESTORE_PROBE_KEY))
  } catch {
    return "unknown"
  }

  if (!Number.isFinite(before)) return "unknown"
  if (before === 0) return "not_applicable"

  const after = countFilledFields(data)
  if (after >= before) return "fully_restored"
  if (after > 0) return "partially_restored"
  return "not_restored"
}

function getPlanType(planId: string): "night-hunter" | "sunset-sup" | "day-sup" | "slide-boat" | "other" {
  switch (planId) {
    case "S3":
    case "S5":
      return "night-hunter"
    case "S4":
    case "S8":
      return "sunset-sup"
    case "S6":
    case "S7":
      return "day-sup"
    case "slide-boat":
      return "slide-boat"
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
  { id: "staff5", name: "そうたろう" },
  { id: "staff3", name: "そういちろう" },
  { id: "staff4", name: "凪" },
]

function getPlanTone(planId: string): "emerald" | "purple" | "cyan" {
  if (planId === "S2" || planId === "S4" || planId === "S5" || planId === "C2" || planId === "S7" || planId === "C4" || planId === "C6") return "purple"
  if (planId === "S6" || planId === "slide-boat" || planId === "C3") return "cyan"
  return "emerald"
}

function priceTextClass(tone: "emerald" | "purple" | "cyan") {
  if (tone === "purple") return "text-purple-700"
  if (tone === "cyan") return "text-cyan-700"
  return "text-emerald-700"
}

function BookingPlanPrice({ planId, className = "" }: { planId: string; className?: string }) {
  const priceDisplay = getPlanPriceDisplay(planId)
  if (!priceDisplay) return null

  const tone = getPlanTone(planId)

  return (
    <div className={className}>
      <div className="mb-1 flex justify-center">
        <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gray-500">{getPlanCode(planId)}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
        {priceDisplay.rows.map((row) => (
          <div key={row.label} className="rounded-lg bg-white/75 px-1 py-1.5 text-center ring-1 ring-gray-100 sm:px-2">
            <span className="block text-[10px] font-semibold leading-none text-gray-500">{row.label}</span>
            <span className={`block whitespace-nowrap text-xs font-black leading-tight tracking-tight sm:text-sm ${priceTextClass(tone)}`}>{row.price}</span>
          </div>
        ))}
      </div>
      {priceDisplay.caption && <p className="mt-1 text-center text-[10px] font-medium text-gray-500">{priceDisplay.caption}</p>}
    </div>
  )
}

export function BookingForm() {
  const searchParams = useSearchParams()
  const hasInitialized = useRef(false)

  // 初期値にはLINEログインのリダイレクト前に保存した下書きを復元する
  // （このフォームはSuspense配下のクライアント描画のため、初期化はブラウザでのみ走る）
  const [bookingData, setBookingData] = useState<BookingData>(() => {
    const restoredDraft = loadBookingDraft() ?? {}
    return {
      selectedPlan: "",
      selectedDate: "",
      selectedTime: "",
      nightTime: "",
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
      ...restoredDraft,
      // 人数・プランと紐づく割引額は保存値を信用せず、必ず再検証する。
      couponDiscount: 0,
    }
  })

  const [totalPrice, setTotalPrice] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [confirmedPricing, setConfirmedPricing] = useState<{ totalPrice: number; couponDiscount: number } | null>(null)
  const appliedCouponRef = useRef<{ code: string; signature: string } | null>(null)
  const submissionInFlightRef = useRef(false)
  const bookingStartedTrackedRef = useRef(false)
  const validationSummaryRef = useRef<HTMLDivElement>(null)

  // 同意済みならURL由来の初期選択イベントより先に予約ファネルIDを用意する。
  // 予約画面を開いてから同意した場合も、同じ画面の以後の操作へIDを付与する。
  useEffect(() => {
    const beginIfConsented = () => {
      if (hasTrackingConsent()) beginBookingFunnelSession()
    }
    beginIfConsented()
    window.addEventListener(TRACKING_CONSENT_EVENT, beginIfConsented)
    return () => window.removeEventListener(TRACKING_CONSENT_EVENT, beginIfConsented)
  }, [])

  // 送信完了画面が出たら見出しへフォーカスを移す（読み上げ・キーボード利用者に完了を確実に伝える）
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (isSubmitted) successHeadingRef.current?.focus()
  }, [isSubmitted])

  useEffect(() => {
    if (hasInitialized.current) return

    const planParam = searchParams?.get("plan")
    const dateParam = searchParams?.get("date")
    const planFromParam = planParam ? BOOKING_PLANS.find((plan) => plan.id === planParam) : undefined
    const canPreselectPlan = !!planFromParam && planFromParam.status !== "coming_soon"

    if (planParam || dateParam) {
      hasInitialized.current = true
      setBookingData((prev) => ({
        ...prev,
        ...(canPreselectPlan && planParam ? { selectedPlan: planParam } : {}),
        ...(dateParam && { selectedDate: dateParam }),
      }))

      // URLやCTA経由の初期選択も、フォーム表示後に1回だけ記録する（入力開始とは別扱い）
      if (canPreselectPlan && planParam) {
        trackPlanSelected({
          planId: planParam,
          locale: "ja",
          selectionSource:
            searchParams?.get("utm_medium") === "article_cta" ? "article_cta" : "url_parameter",
        })
      }
    }
  }, [searchParams])

  // 入力内容を随時sessionStorageへ退避（LINEログインのリダイレクトを跨いで復元するため）
  useEffect(() => {
    if (isSubmitted) return
    saveBookingDraft(bookingData)
    // 復元判定用に「埋まっている項目数」も併せて控える（値は保存しない）
    saveRestoreProbe(bookingData)
  }, [bookingData, isSubmitted])

  // プロフィールは表示専用。予約APIにはサーバー検証用のID tokenだけを送る。
  const { lineUserId: liffUserId, lineDisplayName: liffDisplayName, lineIdToken, isLiffReady, isLiffLoggedIn, isInClient, liffError, loginLiff, retryLiff, closeWindow, getFreshLineIdToken, invalidateLineSession, consumeLineLoginReturn } = useLiff()
  const hasFreshLineSession = isLiffLoggedIn && !!liffUserId && !!lineIdToken

  // フォーム表示を1回だけ計測。
  // book_cta_click → booking_form_view → line_login_click → booking_submitted のファネルを見る。
  //
  // 以前は isLiffReady を待って発火していたが、これは LINE の SDK を外部から読み込み
  // liff.init() の通信が終わるまで true にならない。回線が細い・SDKが読めない・
  // 初期化が返ってこない場合に永久に発火せず、一方でフォームの操作はできるため
  // 「フォーム表示48 < 入力開始61」というありえない数字になっていた。
  // フォームが表示された事実は LIFF と無関係なので、マウント時点で記録する。
  // LINEログイン状態はこの時点では未確定なため、line_ready で判別できるようにする。
  const hasTrackedFormView = useRef(false)
  useEffect(() => {
    const trackIfConsented = () => {
      if (!hasTrackingConsent() || hasTrackedFormView.current) return
      hasTrackedFormView.current = true
      trackBookingFormView({
        locale: "ja",
        lineAuthenticated: hasFreshLineSession,
        lineReady: isLiffReady,
        source: getAttributionSourceLabel(),
      })
    }
    trackIfConsented()
    window.addEventListener(TRACKING_CONSENT_EVENT, trackIfConsented)
    return () => window.removeEventListener(TRACKING_CONSENT_EVENT, trackIfConsented)
    // 表示の記録はマウント時の1回だけ。LIFFの準備完了を待たない。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // LINE認証から戻った直後に、セッションが有効かと下書きが戻ったかを1回だけ記録する。
  // 復元の判定には「埋まっていた項目数」だけを使い、入力値そのものは一切参照しない。
  useEffect(() => {
    if (!isLiffReady) return
    const lineReturn = consumeLineLoginReturn()
    if (!lineReturn) return
    if (!hasFreshLineSession) return

    trackLineLoginSucceeded({
      returnPath: lineReturn.returnPath,
      sessionFresh: true,
      formRestored: readRestoreProbeResult(bookingData),
    })
    // bookingData は復元直後の1回だけ読むため依存に入れない（毎回の再送信を避ける）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiffReady, hasFreshLineSession, consumeLineLoginReturn])

  const selectedPlanData = BOOKING_PLANS.find((plan) => plan.id === bookingData.selectedPlan)
  const selectedPlanIsComingSoon = selectedPlanData?.status === "coming_soon"
  const maxParticipants = getPlanMaxParticipants(bookingData.selectedPlan)
  const totalParticipantCount = bookingData.adultCount + bookingData.childCount + bookingData.under3Count
  const isOverParticipantLimit = maxParticipants !== undefined && totalParticipantCount > maxParticipants
  const isParticipantLimitReached = maxParticipants !== undefined && totalParticipantCount >= maxParticipants

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
    const isNightHunter = bookingData.selectedPlan === "S3" || bookingData.selectedPlan === "S5"

    return {
      childLabel: isNightHunter ? "子ども（4-12歳）" : "子ども（5-12歳）",
      minAge: isNightHunter ? 4 : 5,
      showUnder3: isNightHunter,
      ageRestrictionMessage: isNightHunter ? "※3歳以下は無料（保護者同伴必須）" : "※5歳未満のお子様は参加できません",
    }
  }

  const { childLabel, minAge, showUnder3, ageRestrictionMessage } = getAgeCategories()

  useEffect(() => {
    if (!showUnder3 && bookingData.under3Count > 0) {
      setBookingData((prev) => ({ ...prev, under3Count: 0 }))
    }
  }, [showUnder3, bookingData.under3Count])

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
            wetsuitRental: false,
            prescriptionMaskRental: false,
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
            wetsuitRental: false,
            prescriptionMaskRental: false,
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
            wetsuitRental: false,
            prescriptionMaskRental: false,
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
  }, [bookingData.adultCount, bookingData.childCount, bookingData.under3Count, bookingData.participants, createParticipants])

  const isNightHunterPlan = bookingData.selectedPlan === "S3" || bookingData.selectedPlan === "S4" || bookingData.selectedPlan === "S5" || bookingData.selectedPlan === "S6" || bookingData.selectedPlan === "S7" || bookingData.selectedPlan === "S8" || bookingData.selectedPlan === "slide-boat"
  const isUnder3FreePlan = bookingData.selectedPlan === "S3" || bookingData.selectedPlan === "S5"
  // 昼夜セットはスタッフ指名不可。夜系プランも従来どおり指名不可。
  const isComboPlan = isComboPlanId(bookingData.selectedPlan)
  const staffSelectable = !isNightHunterPlan && !isComboPlan
  const rentalCounts = getRentalCounts(bookingData.participants)
  const rentalUnitPrice = getRentalUnitPrice(bookingData.selectedPlan)
  const rentalTotal = calculateRentalTotal(bookingData.selectedPlan, bookingData.participants)

  useEffect(() => {
    if (!staffSelectable && bookingData.selectedStaff) {
      setBookingData((prev) => ({ ...prev, selectedStaff: "" }))
    }
  }, [staffSelectable, bookingData.selectedStaff])

  // 昼夜セットはクーポン対象外。他プランで適用済みの割引を引き継がないようクリア。
  useEffect(() => {
    if (isComboPlan && bookingData.couponDiscount > 0) {
      setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
    }
  }, [isComboPlan, bookingData.couponDiscount])

  useEffect(() => {
    // Calculate per-person pricing for all plans
    const baseTotal = bookingData.adultCount * adultPrice + bookingData.childCount * childPrice

    const under3Price = isUnder3FreePlan ? 0 : childPrice
    const under3Total = bookingData.under3Count * under3Price

    const vipSurcharge = selectedPlanData?.vipSurcharge || 0

    const staffFee = staffSelectable ? getStaffFee(bookingData.selectedStaff) : 0

    setTotalPrice(
      Math.max(
        0,
        baseTotal + under3Total + vipSurcharge + staffFee + rentalTotal - bookingData.couponDiscount,
      ),
    )
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
    isNightHunterPlan,
    isUnder3FreePlan,
    staffSelectable,
    rentalTotal,
  ])

  const handleInputChange = (field: keyof BookingData, value: any) => {
    // 計測のみ。既存の状態更新ロジックには手を入れない。
    if (field === "selectedPlan" && value) {
      trackBookingStarted("plan")
      trackPlanSelected({ planId: String(value), locale: "ja", selectionSource: "manual" })
    } else if (field === "selectedDate" && value) {
      trackBookingStarted("date")
    } else if ((field === "selectedTime" || field === "nightTime") && value) {
      trackBookingStarted("time")
      trackTimeSelected({
        planId: bookingData.selectedPlan,
        locale: "ja",
        timeSlot: field === "nightTime" ? `night:${value}` : String(value),
      })
    }

    setBookingData((prev) => {
      // プランごとに選べる時間枠が違うため、プラン切替時は選択済みの時間を破棄する
      // （残すと、切替後の枠に無い時刻のままサーバー検証で弾かれてしまう）
      if (field === "selectedPlan" && value !== prev.selectedPlan) {
        const rentalsAvailable = planOffersRentals(String(value))
        return {
          ...prev,
          selectedPlan: value,
          selectedTime: "",
          nightTime: "",
          couponDiscount: 0,
          participants: prev.participants.map((participant) => ({
            ...participant,
            wetsuitRental: rentalsAvailable && participant.wetsuitRental === true,
            prescriptionMaskRental:
              rentalsAvailable &&
              participant.category === "adult" &&
              participant.prescriptionMaskRental === true,
          })),
        }
      }
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  const handleCouponApply = async () => {
    // コード一覧をバンドルに含めないため、検証はサーバーAPIで行う
    // （最終的な割引額も予約API側で再計算される）
    setIsApplyingCoupon(true)
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: bookingData.couponCode,
          adultCount: bookingData.adultCount,
          childCount: bookingData.childCount,
          planId: bookingData.selectedPlan,
        }),
      })
      const result = await response.json().catch(() => ({ valid: false, discount: 0 }))
      if (response.ok && result.valid) {
        const normalizedCode = bookingData.couponCode.trim()
        appliedCouponRef.current = {
          code: normalizedCode,
          signature: `${bookingData.selectedPlan}|${bookingData.adultCount}|${bookingData.childCount}`,
        }
        setBookingData((prev) => ({ ...prev, couponDiscount: result.discount }))
      } else {
        appliedCouponRef.current = null
        setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
        toast.error(result.error || "クーポンコードが正しくありません")
      }
    } catch {
      appliedCouponRef.current = null
      setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
      toast.error("クーポンの確認に失敗しました。通信環境をご確認ください。")
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // 適用後に人数やプランが変わったら、同じコードをサーバーで再計算する。
  useEffect(() => {
    const appliedCoupon = appliedCouponRef.current
    if (!appliedCoupon) return

    const signature = `${bookingData.selectedPlan}|${bookingData.adultCount}|${bookingData.childCount}`
    if (signature === appliedCoupon.signature) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsApplyingCoupon(true)
      try {
        const response = await fetch("/api/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: appliedCoupon.code,
            adultCount: bookingData.adultCount,
            childCount: bookingData.childCount,
            planId: bookingData.selectedPlan,
          }),
        })
        const result = await response.json().catch(() => ({ valid: false, discount: 0 }))
        if (cancelled) return

        if (response.ok && result.valid) {
          appliedCouponRef.current = { ...appliedCoupon, signature }
          setBookingData((prev) => ({ ...prev, couponDiscount: result.discount }))
        } else {
          appliedCouponRef.current = null
          setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
          toast.error(result.error || "条件変更後はこのクーポンを利用できません")
        }
      } catch {
        if (!cancelled) {
          appliedCouponRef.current = null
          setBookingData((prev) => ({ ...prev, couponDiscount: 0 }))
          toast.error("クーポンの再計算に失敗しました。もう一度適用してください")
        }
      } finally {
        if (!cancelled) setIsApplyingCoupon(false)
      }
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [bookingData.adultCount, bookingData.childCount, bookingData.selectedPlan])

  const handleCouponCodeChange = (value: string) => {
    appliedCouponRef.current = null
    setBookingData((prev) => ({ ...prev, couponCode: value, couponDiscount: 0 }))
  }

  const handleParticipantChange = (participantId: string, field: keyof ParticipantDetails, value: any) => {
    // フォーカスではなく実際の入力で1回だけ記録する
    trackParticipantDetailsStarted({
      planId: bookingData.selectedPlan,
      participantCount: bookingData.participants.length,
      locale: "ja",
    })

    setBookingData((prev) => ({
      ...prev,
      participants: prev.participants.map((participant) =>
        participant.id === participantId ? { ...participant, [field]: value } : participant,
      ),
    }))
  }

  const handleCountChange = (field: "adultCount" | "childCount" | "under3Count", increment: boolean) => {
    if (increment && isParticipantLimitReached) {
      toast.error(`Web予約は最大${maxParticipants}名までです。11名以上はLINEでご相談ください`)
      return
    }
    trackBookingStarted("participants")
    setBookingData((prev) => ({
      ...prev,
      [field]: Math.max(0, prev[field] + (increment ? 1 : -1)),
      // 次のeffectで新しい人数に合わせてサーバー再計算するまで古い額を表示しない。
      couponDiscount: appliedCouponRef.current ? 0 : prev.couponDiscount,
    }))
  }

  // 入力開始の起点。従来は input イベントだけだったため、プラン・時間・人数のような
  // ボタン操作では発火しなかった。最初の操作が何であれ1回だけ記録する。
  const trackBookingStarted = (firstInteractionType: FirstInteractionType = "text_input") => {
    if (bookingStartedTrackedRef.current) return

    bookingStartedTrackedRef.current = true
    trackBookingStartedEvent({
      locale: "ja",
      planId: bookingData.selectedPlan,
      lineAuthenticated: hasFreshLineSession,
      firstInteractionType,
    })
  }

  // input/checkbox 由来の開始。テキスト入力とチェックボックスを区別する。
  const handleFormInputCapture = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement | null
    const isCheckbox =
      target instanceof HTMLInputElement && (target.type === "checkbox" || target.type === "radio")
    const isDate = target instanceof HTMLInputElement && target.type === "date"
    trackBookingStarted(isCheckbox ? "checkbox" : isDate ? "date" : "text_input")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submissionInFlightRef.current) return

    if (!isFormValid) {
      const firstMissingItem = missingItems[0]
      toast.error(
        firstMissingItem
          ? `まだ送信できません。「${firstMissingItem}」を確認してください。`
          : "入力内容を確認してください。",
      )
      window.requestAnimationFrame(() => {
        validationSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        validationSummaryRef.current?.focus({ preventScroll: true })
      })
      return
    }

    const liffRequired = !!process.env.NEXT_PUBLIC_LIFF_ID
    if (liffRequired && !isLiffReady) {
      toast.error("LINE連携の準備が完了していません。再接続を開始します。")
      retryLiff()
      return
    }
    if (liffRequired && !hasFreshLineSession) {
      if (liffError) {
        toast.error("LINE連携を再試行します。完了後にもう一度送信してください。")
        retryLiff()
      } else {
        toast.info("予約送信にはLINEログインが必要です。入力内容を保存してログイン画面へ移動します。")
        loginLiff()
      }
      return
    }

    if (selectedPlanIsComingSoon) {
      toast.error("このプランは近日公開のため、まだ予約できません")
      return
    }

    // LINEのIDトークンは発行から約1時間で失効し自動更新されないため、送信直前に有効性を確認する。
    // 期限切れならセッションが破棄され、フォームは自動的にLINEログイン導線へ戻る（入力内容は保存済み）。
    const freshLineIdToken = getFreshLineIdToken()
    if (!!process.env.NEXT_PUBLIC_LIFF_ID && !freshLineIdToken) {
      toast.error("LINEログインの有効期限が切れました。お手数ですが、もう一度LINEログインしてから送信してください（入力内容は保存されています）。")
      return
    }
    submissionInFlightRef.current = true
    setIsSubmitting(true)
    setSubmitError(null)
    let failureCategory = categorizeBookingFailure()
    let failureStage = toBookingFailureStage()

    // API通信の直前。計測の完了を待たずに送信処理へ進む。
    trackSubmitClicked({
      planId: bookingData.selectedPlan,
      participantCount: bookingData.adultCount + bookingData.childCount + bookingData.under3Count,
      totalAmount: totalPrice,
      lineAuthenticated: hasFreshLineSession,
      locale: "ja",
    })

    // 氏名が未入力の参加者は内部的に「参加者1」「参加者2」…として扱う
    const participantsForSubmit = bookingData.participants.map((p, index) => ({
      ...p,
      name: p.name.trim() === "" ? `参加者${index + 1}` : p.name.trim(),
      wetsuitRental:
        planOffersRentals(bookingData.selectedPlan) && p.wetsuitRental === true,
      prescriptionMaskRental:
        planOffersRentals(bookingData.selectedPlan) &&
        p.category === "adult" &&
        p.prescriptionMaskRental === true,
    }))

    // セットは1件の予約として受付し、詳細を備考欄の [COMBO booking] ブロックに残す。
    // 海亀時刻は selectedTime、SUP(あれば)・ナイト時刻(あれば)を順に格納する。
    // トリプル(C5/C6)は SUP＋ナイトの両方が入る。
    const finalSpecialRequests = isComboPlan
      ? [
          "[COMBO booking]",
          `プラン：${selectedPlanData?.name || "セットプラン"}`,
          getComboContentText(bookingData.selectedPlan),
          `海亀希望時間：${bookingData.selectedTime}`,
          ...(planHasSup(bookingData.selectedPlan) ? [`ドローンSUP希望時間：${DAY_SUP_TIME_NOTE}`] : []),
          ...(planHasNight(bookingData.selectedPlan) ? [`ヤシガニ探検希望時間：${bookingData.nightTime}`] : []),
          ...(bookingData.specialRequests.trim() ? ["───", bookingData.specialRequests.trim()] : []),
        ].join("\n")
      : bookingData.specialRequests

    try {
      const requestBody = {
        ...bookingData,
        participants: participantsForSubmit,
        // 昼夜セットは備考に [COMBO booking] ブロックを付与（...bookingData の specialRequests を上書き）
        specialRequests: finalSpecialRequests,
        // 本人情報は送らず、サーバーがLINE公式APIで検証するID tokenだけを渡す。
        lineIdToken: freshLineIdToken,
        planName: selectedPlanData?.name,
        staffName: STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name,
        adultPrice,
        childPrice,
        vipSurcharge: selectedPlanData?.vipSurcharge || 0,
        totalPrice,
        couponCode: bookingData.couponCode,
        couponDiscount: bookingData.couponDiscount,
        // 流入元（どのリンク経由か）。管理者メール・カレンダーの備考に [流入元] として載る
        attribution: getAttribution(),
        // 同意済みの場合だけ、予約前の閲覧履歴と予約を結合する識別子を送る。
        customerAnalytics: getBookingCustomerAnalytics(),
      }
      const submissionId = await getOrCreateBookingSubmissionId("ja", {
        selectedPlan: bookingData.selectedPlan,
        selectedDate: bookingData.selectedDate,
        selectedTime: bookingData.selectedTime,
        nightTime: bookingData.nightTime,
        selectedStaff: bookingData.selectedStaff,
        customerName: bookingData.customerName.trim(),
        customerEmail: bookingData.customerEmail.trim(),
        customerPhone: bookingData.customerPhone.trim(),
        participants: participantsForSubmit,
        specialRequests: finalSpecialRequests,
        agreedToTerms: bookingData.agreedToTerms,
        couponCode: bookingData.couponCode.trim(),
      })

      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": submissionId,
        },
        body: JSON.stringify(requestBody),
      })
      failureCategory = categorizeBookingFailure(response.status)
      failureStage = toBookingFailureStage(response.status)

      const responseData: {
        success?: boolean
        error?: string
        data?: { bookingNumber?: unknown; totalPrice?: unknown; couponDiscount?: unknown }
      } | null = await response.json().catch(() => null)
      if (!response.ok || responseData?.success !== true) {
        if (response.status === 401) {
          // サーバーがLINE認証を拒否 → 古いセッションを破棄してログイン導線へ戻す
          invalidateLineSession()
        }
        const publicErrorMessage =
          response.status < 500 && responseData?.error
            ? responseData.error
            : "予約を送信できませんでした。時間をおいてもう一度お試しいただくか、LINEでお問い合わせください。"
        throw new Error(publicErrorMessage)
      }

      // APIがJSONで success: true を返した場合だけ完了画面へ進む。
      // GA4のvalueには、改ざん可能なクライアント値よりAPIの再計算結果を優先する。
      const confirmedTotalPrice =
        typeof responseData.data?.totalPrice === "number" &&
        Number.isFinite(responseData.data.totalPrice) &&
        responseData.data.totalPrice >= 0
          ? responseData.data.totalPrice
          : totalPrice
      const confirmedCouponDiscount =
        typeof responseData.data?.couponDiscount === "number" &&
        Number.isFinite(responseData.data.couponDiscount) &&
        responseData.data.couponDiscount >= 0
          ? responseData.data.couponDiscount
          : bookingData.couponDiscount
      setConfirmedPricing({ totalPrice: confirmedTotalPrice, couponDiscount: confirmedCouponDiscount })
      sendDetailedEvent("booking_submitted", {
        locale: "ja",
        plan: bookingData.selectedPlan,
        planName: selectedPlanData?.name ?? "",
        headcount: bookingData.adultCount + bookingData.childCount + bookingData.under3Count,
        adultCount: bookingData.adultCount,
        childCount: bookingData.childCount,
        under3Count: bookingData.under3Count,
        total: confirmedTotalPrice,
        currency: "JPY",
        source: getAttributionSourceLabel(),
        outcome: "success",
        booking_id: typeof responseData.data?.bookingNumber === "string" ? responseData.data.bookingNumber : "",
      })
      completeCustomerBookingFunnel()
      clearBookingDraft()
      clearBookingSubmissionId("ja")
      setIsSubmitted(true)
    } catch (error) {
      sendDetailedEvent("booking_failed", {
        locale: "ja",
        plan: bookingData.selectedPlan,
        planName: selectedPlanData?.name ?? "",
        headcount: bookingData.adultCount + bookingData.childCount + bookingData.under3Count,
        adultCount: bookingData.adultCount,
        childCount: bookingData.childCount,
        under3Count: bookingData.under3Count,
        total: totalPrice,
        currency: "JPY",
        source: getAttributionSourceLabel(),
        outcome: "failed",
        errorCategory: failureCategory,
        // どの段階で落ちたかを区別する（生のエラー内容は送らない）
        stage: failureStage,
      })
      const errorMessage = error instanceof Error ? error.message : "予約の送信中にエラーが発生しました。もう一度お試しください。"
      setSubmitError(
        `${errorMessage} 同じ内容で再送しても重複登録されないよう保護されています。`,
      )
      toast.error(errorMessage)
    } finally {
      submissionInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  // グループ版プランは60歳以上をお断り（貸切版へ案内）。判定は lib/plan-flags を単一ソースに。
  const seniorCounterpartName = getPrivateCounterpartName(bookingData.selectedPlan)
  const hasSeniorOnRegularSnorkel =
    SENIOR_RESTRICTED_PLAN_IDS.has(bookingData.selectedPlan) &&
    bookingData.participants.some((p) => typeof p.age === "number" && p.age >= 60)
  const isNightTourForDetails =
    bookingData.selectedPlan === "S3" || bookingData.selectedPlan === "S5"
  // セットは海亀時間(selectedTime)が必須。夜を含むプラン(C1/C2/C5/C6)は夜時間(nightTime)も必須。
  // SUPは確定時案内のため選択不要。トリプル(C5/C6)は海亀＋夜の2つを要求。
  const comboTimesSelected =
    !isComboPlan ||
    (!!bookingData.selectedTime && (!planHasNight(bookingData.selectedPlan) || !!bookingData.nightTime))

  const isFormValid =
    bookingData.selectedPlan &&
    bookingData.selectedDate &&
    (getPlanType(bookingData.selectedPlan) === "sunset-sup" || bookingData.selectedTime) &&
    comboTimesSelected &&
    bookingData.adultCount > 0 &&
    !isOverParticipantLimit &&
    bookingData.customerName &&
    bookingData.customerEmail &&
    bookingData.customerPhone &&
    bookingData.agreedToTerms &&
    !selectedPlanIsComingSoon &&
    !hasSeniorOnRegularSnorkel &&
    bookingData.participants.every((p) => {
      if (!isParticipantAgeValid(bookingData.selectedPlan, p.category, p.age)) {
        return false
      }

      // ナイトツアーは足のサイズも任意。シュノーケル系はフィン準備のため足のサイズのみ必須
      if (isNightTourForDetails) {
        return true
      } else {
        return typeof p.footSize === "number" && p.footSize > 0
      }
    })

  // 送信ボタンが押せない理由を具体的に列挙する（isFormValid と同じ条件の人間向け翻訳）。
  // 長いフォームで「なぜ送れないのか」が分からないままの離脱を防ぐ。
  // 60歳以上の制限は専用の赤い案内枠があるためここには含めない。
  const missingItems: string[] = []
  if (!bookingData.selectedPlan) missingItems.push("プランの選択")
  else if (selectedPlanIsComingSoon) missingItems.push("プランの変更（選択中のプランは近日公開のため、まだ予約できません）")
  if (!bookingData.selectedDate) missingItems.push("参加日の選択")
  if (bookingData.selectedPlan && getPlanType(bookingData.selectedPlan) !== "sunset-sup" && !bookingData.selectedTime) {
    missingItems.push(isComboPlan ? "ウミガメツアーの開始時間の選択" : "開始時間の選択")
  }
  if (isComboPlan && planHasNight(bookingData.selectedPlan) && !bookingData.nightTime) {
    missingItems.push("ヤシガニ探検の開始時間の選択")
  }
  if (bookingData.adultCount + bookingData.childCount + bookingData.under3Count === 0) {
    missingItems.push("参加人数の選択")
  } else if (bookingData.adultCount === 0) {
    missingItems.push("大人（13歳以上）を1名以上含める")
  }
  if (isOverParticipantLimit && maxParticipants !== undefined) {
    missingItems.push(`参加人数を${maxParticipants}名以下にする（11名以上はLINE相談）`)
  }
  bookingData.participants.forEach((p, index) => {
    // 上限超過は区分の付け替えでは直らないため、案内文を分ける
    if (isOverParticipantAgeLimit(bookingData.selectedPlan, p.age)) {
      missingItems.push(
        `参加者${index + 1}の年齢はWeb予約の対象年齢（${getAdultAgeMax(bookingData.selectedPlan)}歳まで）を超えています。LINEでご相談ください`,
      )
    } else if (!isParticipantAgeValid(bookingData.selectedPlan, p.category, p.age)) {
      missingItems.push(`参加者${index + 1}の年齢・年齢区分`)
    }
    if (!isNightTourForDetails && !(typeof p.footSize === "number" && p.footSize > 0)) {
      missingItems.push(`参加者${index + 1}の足のサイズ`)
    }
  })
  if (!bookingData.customerName) missingItems.push("代表者氏名の入力")
  if (!bookingData.customerEmail) missingItems.push("メールアドレスの入力")
  if (!bookingData.customerPhone) missingItems.push("電話番号の入力")
  if (!bookingData.agreedToTerms) missingItems.push("キャンセルポリシーへの同意チェック")
  if (!!process.env.NEXT_PUBLIC_LIFF_ID) {
    if (!isLiffReady) missingItems.push("LINE情報の取得完了")
    else if (liffError) missingItems.push("LINE連携の再試行")
    else if (!hasFreshLineSession) missingItems.push("LINEログイン")
  }

  // ============================================================
  // ファネル計測（表示・入力順序・必須条件には影響しない観測のみ）
  // ============================================================

  const participantCount = totalParticipantCount
  const participantDetailsComplete =
    bookingData.participants.length > 0 &&
    bookingData.participants.every((p) => {
      if (!isParticipantAgeValid(bookingData.selectedPlan, p.category, p.age)) return false
      return isNightTourForDetails || (typeof p.footSize === "number" && p.footSize > 0)
    })
  const representativeComplete =
    !!bookingData.customerName && !!bookingData.customerEmail && !!bookingData.customerPhone

  // 到達済みの最終ステージ。画面の日本語ではなく BOOKING_STAGES の値だけを使う。
  const completedStage: BookingStage = isSubmitted
    ? "completed"
    : participantDetailsComplete && representativeComplete
      ? "participant_details"
      : representativeComplete
        ? "representative"
        : totalPrice > 0 && participantCount > 0
          ? "price"
          : participantCount > 0
            ? "participants"
            : bookingData.selectedTime || bookingData.nightTime
              ? "time"
              : bookingData.selectedDate
                ? "date"
                : bookingData.selectedPlan
                  ? "plan"
                  : hasFreshLineSession
                    ? "line_login"
                    : "form_view"
  const currentStage: BookingStage =
    completedStage === "participant_details" && missingItems.length > 0
      ? "submission"
      : completedStage

  const funnelStateRef = useRef({ completedStage, currentStage, participantCount, planId: "" })
  funnelStateRef.current = {
    completedStage,
    currentStage,
    participantCount,
    planId: bookingData.selectedPlan,
  }

  const formOpenedAtRef = useRef(Date.now())

  // 参加日 → 何日後かの「区分」だけを記録する（実際の日付は送らない）
  useEffect(() => {
    if (!bookingData.selectedDate || !bookingData.selectedPlan) return
    trackDateSelected({
      planId: bookingData.selectedPlan,
      locale: "ja",
      bookingTiming: toBookingTiming(daysUntilDate(bookingData.selectedDate, todayStr())),
    })
  }, [bookingData.selectedDate, bookingData.selectedPlan])

  // 予約ルール上、有効な人数になった時点
  useEffect(() => {
    if (!bookingData.selectedPlan) return
    if (bookingData.adultCount <= 0 || isOverParticipantLimit) return
    trackParticipantsCompleted({
      planId: bookingData.selectedPlan,
      adultCount: bookingData.adultCount,
      childCount: bookingData.childCount,
      under3Count: bookingData.under3Count,
    })
  }, [
    bookingData.selectedPlan,
    bookingData.adultCount,
    bookingData.childCount,
    bookingData.under3Count,
    isOverParticipantLimit,
  ])

  // 合計金額が画面に出た時点。クーポンコード・スタッフ名は送らず適用有無だけ。
  useEffect(() => {
    if (!bookingData.selectedPlan || participantCount <= 0 || totalPrice <= 0) return
    trackPriceConfirmed({
      planId: bookingData.selectedPlan,
      totalAmount: totalPrice,
      couponApplied: bookingData.couponDiscount > 0,
      staffRequestApplied: !!bookingData.selectedStaff,
      participantCount,
    })
  }, [
    bookingData.selectedPlan,
    bookingData.couponDiscount,
    bookingData.selectedStaff,
    participantCount,
    totalPrice,
  ])

  // 代表者情報の必須が揃った時点。氏名・電話の実値は送らない。
  useEffect(() => {
    if (!representativeComplete || !bookingData.selectedPlan) return
    trackRepresentativeCompleted({
      planId: bookingData.selectedPlan,
      locale: "ja",
      lineAuthenticated: hasFreshLineSession,
      contactRequirementsCompleted: representativeComplete,
    })
  }, [representativeComplete, bookingData.selectedPlan, hasFreshLineSession])

  // 全参加者の必須が揃った時点。年齢・身長・体重・足サイズの実値は送らない。
  useEffect(() => {
    if (!participantDetailsComplete || !bookingData.selectedPlan) return
    trackParticipantDetailsCompleted({
      planId: bookingData.selectedPlan,
      participantCount: bookingData.participants.length,
      wetsuitRequested: rentalCounts.wetsuit,
      prescriptionMaskRequested: rentalCounts.prescriptionMask,
    })
  }, [
    participantDetailsComplete,
    bookingData.selectedPlan,
    bookingData.participants.length,
    rentalCounts.wetsuit,
    rentalCounts.prescriptionMask,
  ])

  // 離脱計測。LINE認証への遷移中は離脱として数えない。
  // タブ切替だけでは離脱扱いにせず、実際にページを破棄する pagehide だけを見る。
  useEffect(() => {
    const reportAbandon = () => {
      if (!bookingStartedTrackedRef.current) return
      if (isSubmitted || submissionInFlightRef.current) return
      if (isLineLoginRedirectInProgress()) return

      const state = funnelStateRef.current
      trackBookingAbandoned({
        lastCompletedStage: state.completedStage,
        currentStage: state.currentStage,
        planId: state.planId,
        elapsedSeconds: Math.round((Date.now() - formOpenedAtRef.current) / 1000),
        participantCount: state.participantCount,
        lineAuthenticated: hasFreshLineSession,
        locale: "ja",
      })
    }

    window.addEventListener("pagehide", reportAbandon)
    return () => {
      window.removeEventListener("pagehide", reportAbandon)
    }
  }, [hasFreshLineSession, isSubmitted])

  // 送信できない状態でユーザーが送信領域を押したときだけ、不足項目の「種別」を記録する
  const handleFormClickCapture = (event: React.MouseEvent<HTMLFormElement>) => {
    if (missingItems.length === 0) return
    const target = event.target as HTMLElement | null
    if (!target?.closest("[data-booking-submit-area]")) return

    trackValidationError({
      currentSection: currentStage,
      actionType: "submit",
      missingFieldCategories: toMissingFieldCategories(),
      planId: bookingData.selectedPlan,
    })
  }

  // 画面の日本語文言ではなく、決められた種別だけを組み立てる
  const toMissingFieldCategories = (): MissingFieldCategory[] => {
    const categories: MissingFieldCategory[] = []
    if (!bookingData.selectedPlan || selectedPlanIsComingSoon) categories.push("plan")
    if (!bookingData.selectedDate) categories.push("date")
    if (
      (bookingData.selectedPlan &&
        getPlanType(bookingData.selectedPlan) !== "sunset-sup" &&
        !bookingData.selectedTime) ||
      (isComboPlan && planHasNight(bookingData.selectedPlan) && !bookingData.nightTime)
    ) {
      categories.push("time")
    }
    if (participantCount === 0 || bookingData.adultCount === 0 || isOverParticipantLimit) {
      categories.push("participant_count")
    }
    bookingData.participants.forEach((p) => {
      if (!isParticipantAgeValid(bookingData.selectedPlan, p.category, p.age)) categories.push("age")
      if (!isNightTourForDetails && !(typeof p.footSize === "number" && p.footSize > 0)) {
        categories.push("foot_size")
      }
    })
    if (!bookingData.customerName) categories.push("representative_name")
    if (!bookingData.customerPhone) categories.push("phone")
    if (!bookingData.agreedToTerms) categories.push("agreement")
    if (!!process.env.NEXT_PUBLIC_LIFF_ID && isLiffReady && !hasFreshLineSession) {
      categories.push("line_authentication")
    }
    if (categories.length === 0 && missingItems.length > 0) categories.push("other")
    return categories
  }

  if (isSubmitted) {
    return (
      <div role="dialog" aria-modal="true" aria-labelledby="booking-success-title" className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4">
      <Card className="glass-card bg-white/95 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-2xl max-w-2xl w-full mx-auto my-4 animate-in fade-in zoom-in duration-300">
        <CardContent className="p-6 sm:p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 ref={successHeadingRef} tabIndex={-1} id="booking-success-title" className="text-2xl font-bold text-emerald-800 mb-4 outline-none">送信完了しました！</h2>
          <p className="text-gray-600 mb-6">
            ご予約ありがとうございます。
            <br />
            スタッフが内容を確認し、LINE公式アカウントから確定のご連絡をお送りします。
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-emerald-800 mb-2">予約内容</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>プラン: {selectedPlanData?.name}</p>
              {isComboPlan ? (
                <>
                  <p>日付: {bookingData.selectedDate}</p>
                  <p>🐢 ウミガメツアー: {bookingData.selectedTime}</p>
                  {planHasSup(bookingData.selectedPlan) && <p>🛸 ドローンSUP: 予約確定時にLINEでご案内</p>}
                  {planHasNight(bookingData.selectedPlan) && <p>🦀 ヤシガニ探検: {bookingData.nightTime}</p>}
                  <p className="text-xs text-emerald-700">※集合場所は、ウミガメ・ドローンSUPは前日に、ヤシガニ探検は当日にLINEでご案内します</p>
                </>
              ) : (
                <p>
                  日時: {bookingData.selectedDate}{" "}
                  {getPlanType(bookingData.selectedPlan) === "sunset-sup"
                    ? "(集合は日没の約90分前・正確な時間と場所は前日にLINEでご連絡)"
                    : bookingData.selectedTime}
                </p>
              )}
              <p>
                人数: 大人{bookingData.adultCount}名 子ども{bookingData.childCount}名
                {bookingData.under3Count > 0 && ` 3歳以下${bookingData.under3Count}名`}
              </p>
              {bookingData.selectedStaff && (
                <p className="text-emerald-600">
                  スタッフ指名: {STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name} (+¥
                  {getStaffFee(bookingData.selectedStaff).toLocaleString()})
                </p>
              )}
              {(selectedPlanData?.vipSurcharge ?? 0) > 0 && (
                <p className="text-orange-600">貸切追加料金: ¥{selectedPlanData!.vipSurcharge!.toLocaleString()}</p>
              )}
              {rentalCounts.wetsuit > 0 && (
                <p className="text-cyan-700">
                  ウェットスーツ: {rentalCounts.wetsuit}名
                  {rentalUnitPrice === 0
                    ? "（プラン料金に含む）"
                    : ` (+¥${(rentalCounts.wetsuit * rentalUnitPrice).toLocaleString()})`}
                </p>
              )}
              {rentalCounts.prescriptionMask > 0 && (
                <p className="text-cyan-700">
                  度付きマスク: {rentalCounts.prescriptionMask}名
                  {rentalUnitPrice === 0
                    ? "（プラン料金に含む）"
                    : ` (+¥${(rentalCounts.prescriptionMask * rentalUnitPrice).toLocaleString()})`}
                </p>
              )}
              {((confirmedPricing?.couponDiscount ?? bookingData.couponDiscount) > 0) && (
                <p className="text-emerald-700">クーポン割引: -¥{(confirmedPricing?.couponDiscount ?? bookingData.couponDiscount).toLocaleString()}</p>
              )}
              <p className="font-semibold text-emerald-800">合計金額: ¥{(confirmedPricing?.totalPrice ?? totalPrice).toLocaleString()}</p>
              <p className="text-emerald-700">お支払い方法: 現地現金決済（ツアー当日・現金）</p>
            </div>
          </div>
          {/* 確定連絡はLINEのプッシュ通知＝「友だち追加」済みでないと届かない。
              未追加のまま送信したお客様に届かない事故を防ぐため、最優先で友だち追加を促す。 */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <span aria-hidden>⚠️</span> 必ずお読みください
            </p>
            <p className="mt-2 text-sm text-amber-900">
              ご予約の確定連絡は <strong>LINE公式アカウント</strong> からお送りします。
              <strong>「友だち追加」がお済みでないと、こちらからご連絡できません。</strong>
              まだの方は、下のボタンから<strong>友だち追加を必ず完了</strong>してください。
            </p>
            <p className="mt-1 text-xs text-amber-700">※LINEログインだけでは通知は届きません。</p>
            <a
              href={LINE_ADD_FRIEND_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("line_add_friend_click", { location: "booking_success" })}
              className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold rounded-lg px-5 py-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
              LINEの友だち追加をする
            </a>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              このあとスタッフが確認し、LINE公式アカウントから確定のご連絡をお送りします。
              <br />
              そのままLINEでご連絡をお待ちください。予約の確定・変更・キャンセルもLINEのトーク画面から承ります。
            </p>
          </div>
          {/* LINEアプリ内で開いている時だけウィンドウを閉じてトークに戻す。
              通常ブラウザ（closeWindow不可）では確実に動く「ホームに戻る」を表示する。 */}
          {isInClient ? (
            <Button
              onClick={closeWindow}
              className="bg-[#06C755] hover:bg-[#05b34d] text-white rounded-xl w-full"
            >
              LINEのトークに戻る
            </Button>
          ) : (
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl w-full">
              <a href="/">ホームに戻る</a>
            </Button>
          )}
        </CardContent>
      </Card>
      </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInputCapture={handleFormInputCapture}
      onClickCapture={handleFormClickCapture}
      className="space-y-8"
    >
      <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Booking Flow</p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">3分で仮予約できます</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[360px]">
            {["プラン", "日時・人数", "連絡先"].map((label, index) => (
              <div key={label} className="rounded-xl bg-emerald-50 px-2 py-2 text-emerald-800">
                <span className="block text-[10px] font-bold text-emerald-500">STEP {index + 1}</span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          送信後すぐに確定ではありません。スタッフが内容を確認し、LINEで集合場所や時間をご案内します。
        </p>
        <p className="mt-1.5 text-sm text-gray-600">
          集合場所は当日の海況で選ぶため前日のご案内です。
          <a href="/access" target="_blank" rel="noopener" className="text-cyan-700 underline underline-offset-2 font-medium">候補ビーチの駐車場・設備はこちら</a>
        </p>
        <p className="mt-2 text-sm font-medium text-amber-700">
          ⚠️ 確定のご連絡はLINEに届きます。<a href={LINE_ADD_FRIEND_URL} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("line_add_friend_click", { location: "booking_intro" })} className="underline font-bold">LINE公式アカウントの「友だち追加」</a>もお済ませください（未追加だと連絡が届きません）。
        </p>
      </div>

      {/* LINE連携ステータス */}
      {!!process.env.NEXT_PUBLIC_LIFF_ID && isLiffReady && (
        hasFreshLineSession ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-sm text-emerald-800 font-medium">LINE連携済み</p>
              <p className="text-xs text-emerald-600">{liffDisplayName || ""}さんとして予約します</p>
            </div>
          </div>
        ) : liffError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800 font-medium">LINE連携でエラーが発生しました</p>
            <p className="text-xs text-red-600 mt-1">{liffError}</p>
            <button
              type="button"
              onClick={retryLiff}
              className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              再試行
            </button>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-medium">予約にはLINE連携が必要です</p>
            <p className="text-xs text-blue-600 mt-1">LINEでログインすると、予約確定通知をお送りできます。入力した内容は自動保存されるので、先にフォームを入力してからのログインでも大丈夫です。</p>
            <button
              type="button"
              onClick={() => {
                trackLineLoginClick({ location: "booking_top", locale: "ja" })
                loginLiff()
              }}
              className="mt-3 px-5 py-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
              LINEでログイン
            </button>
          </div>
        )
      )}
      {/* Plan Selection */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-emerald-800">
            <CheckCircle className="w-5 h-5" />
            プラン選択
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">ご希望のプランを選択してください</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ウミガメシュノーケル */}
            {(() => {
              const s1 = BOOKING_PLANS.find(p => p.id === "S1")!
              const s2 = BOOKING_PLANS.find(p => p.id === "S2")!
              const isS1Selected = bookingData.selectedPlan === "S1"
              const isS2Selected = bookingData.selectedPlan === "S2"
              const isSnorkelSelected = isS1Selected || isS2Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isSnorkelSelected ? "border-emerald-500 shadow-lg" : "border-gray-200"}`}>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1">ウミガメシュノーケルツアー</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s1.durationHours}時間</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS1Selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
                        <input type="radio" name="plan" value="S1" checked={isS1Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                        <p className="text-xs text-gray-500 mb-0.5">通常プラン</p>
                        <BookingPlanPrice planId="S1" className="mt-1" />
                      </label>
                      <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS2Selected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                        <input type="radio" name="plan" value="S2" checked={isS2Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                        <p className="text-xs text-purple-600 font-semibold mb-0.5">貸切プラン</p>
                        <BookingPlanPrice planId="S2" className="mt-1" />
                      </label>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ナイトツアー */}
            {(() => {
              const s3 = BOOKING_PLANS.find(p => p.id === "S3")!
              const s5 = BOOKING_PLANS.find(p => p.id === "S5")
              const isS3Selected = bookingData.selectedPlan === "S3"
              const isS5Selected = bookingData.selectedPlan === "S5"
              const isNightSelected = isS3Selected || isS5Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isNightSelected ? "border-emerald-500 shadow-lg" : "border-gray-200"}`}>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1">本格ナイトツアー</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s3.durationHours}時間</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS3Selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-emerald-300"}`}>
                        <input type="radio" name="plan" value="S3" checked={isS3Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                        <p className="text-xs text-gray-500 mb-0.5">通常プラン</p>
                        <BookingPlanPrice planId="S3" className="mt-1" />
                      </label>
                      {s5 && (
                        <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS5Selected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                          <input type="radio" name="plan" value="S5" checked={isS5Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                          <p className="text-xs text-purple-600 font-semibold mb-0.5">貸切プラン</p>
                          <BookingPlanPrice planId="S5" className="mt-1" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* サンセットSUP（通常・貸切） */}
            {(() => {
              const s8 = BOOKING_PLANS.find(p => p.id === "S8")
              const s4 = BOOKING_PLANS.find(p => p.id === "S4")
              if (!s8) return null
              const isS8Selected = bookingData.selectedPlan === "S8"
              const isS4Selected = bookingData.selectedPlan === "S4"
              const isSunsetSelected = isS8Selected || isS4Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isSunsetSelected ? isS4Selected ? "border-purple-500 shadow-lg bg-purple-50/30" : "border-orange-500 shadow-lg bg-orange-50/40" : "border-gray-200 hover:border-orange-300"}`}>
                  <div className="p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">サンセットSUP</h3>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">映え度No.1</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">夕日を浴びながらの海上散歩</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s8.durationHours}時間</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS8Selected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
                        <input type="radio" name="plan" value="S8" checked={isS8Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                        <p className="text-xs text-gray-500 mb-0.5">通常プラン</p>
                        <BookingPlanPrice planId="S8" className="mt-1" />
                      </label>
                      {s4 && (
                        <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS4Selected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                          <input type="radio" name="plan" value="S4" checked={isS4Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                          <p className="text-xs text-purple-600 font-semibold mb-0.5">貸切プラン</p>
                          <BookingPlanPrice planId="S4" className="mt-1" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 宮古島ドローンSUP体験（通常・貸切） */}
            {(() => {
              const s6 = BOOKING_PLANS.find(p => p.id === "S6")
              const s7 = BOOKING_PLANS.find(p => p.id === "S7")
              if (!s6) return null
              const isS6Selected = bookingData.selectedPlan === "S6"
              const isS7Selected = bookingData.selectedPlan === "S7"
              const isDaySupSelected = isS6Selected || isS7Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isDaySupSelected ? isS7Selected ? "border-purple-500 shadow-lg bg-purple-50/30" : "border-cyan-500 shadow-lg bg-cyan-50/40" : "border-gray-200 hover:border-cyan-300"}`}>
                  <div className="p-4">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-base">宮古島ドローンSUP体験</h3>
                      <span className="text-[10px] bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-bold">ドローン撮影付き</span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">日中の宮古ブルーを海上と空から撮影</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{s6.durationHours}時間</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS6Selected ? "border-cyan-500 bg-cyan-50" : "border-gray-200 hover:border-cyan-300"}`}>
                        <input type="radio" name="plan" value="S6" checked={isS6Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                        <p className="text-xs text-gray-500 mb-0.5">通常プラン</p>
                        <BookingPlanPrice planId="S6" className="mt-1" />
                      </label>
                      {s7 && (
                        <label className={`cursor-pointer p-2 sm:p-3 rounded-xl border-2 text-center transition-all ${isS7Selected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-purple-300"}`}>
                          <input type="radio" name="plan" value="S7" checked={isS7Selected} onChange={(e) => handleInputChange("selectedPlan", e.target.value)} className="sr-only" />
                          <p className="text-xs text-purple-600 font-semibold mb-0.5">貸切プラン</p>
                          <BookingPlanPrice planId="S7" className="mt-1" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ウミガメシュノーケル＆ヤシガニ探検 昼夜セット */}
            {(() => {
              const c1 = BOOKING_PLANS.find(p => p.id === "C1")
              const c2 = BOOKING_PLANS.find(p => p.id === "C2")
              const comboPlans = [c1, c2].filter(Boolean) as NonNullable<typeof c1>[]
              if (!comboPlans.length) return null
              const isC1Selected = bookingData.selectedPlan === "C1"
              const isC2Selected = bookingData.selectedPlan === "C2"
              const isComboSelected = isC1Selected || isC2Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isComboSelected ? isC2Selected ? "border-purple-500 shadow-lg bg-purple-50/30" : "border-emerald-500 shadow-lg bg-emerald-50/40" : "border-gray-200 hover:border-emerald-300"}`}>
                  <div className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">ウミガメシュノーケル＆ヤシガニ探検 昼夜セット</h3>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">セットでお得</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">昼：ウミガメシュノーケル ＋ 夜：ヤシガニ探検</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />昼2h＋夜1.5h</span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {comboPlans.map((plan) => {
                          const isPrivate = plan.id === "C2"
                          const isSelected = bookingData.selectedPlan === plan.id
                          return (
                            <label
                              key={plan.id}
                              className={`block cursor-pointer rounded-xl border-2 p-3 transition-all ${
                                isSelected
                                  ? isPrivate
                                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                                    : "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                                  : "border-gray-200 bg-white hover:border-emerald-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={isSelected}
                                onChange={(e) => handleInputChange("selectedPlan", e.target.value)}
                                className="sr-only"
                              />
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className={`text-xs font-bold ${isSelected && isPrivate ? "text-purple-700" : "text-gray-700"}`}>
                                  {isPrivate ? "貸切セット" : "通常セット"}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isPrivate ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {isPrivate ? "完全貸切" : "1,000円お得"}
                                </span>
                              </div>
                              <BookingPlanPrice planId={plan.id} />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ウミガメシュノーケル＆ドローンSUP 海空セット（通常・貸切） */}
            {(() => {
              const c3 = BOOKING_PLANS.find(p => p.id === "C3")
              const c4 = BOOKING_PLANS.find(p => p.id === "C4")
              const seaSkyPlans = [c3, c4].filter(Boolean) as NonNullable<typeof c3>[]
              if (!seaSkyPlans.length) return null
              const isC3Selected = bookingData.selectedPlan === "C3"
              const isC4Selected = bookingData.selectedPlan === "C4"
              const isSeaSkySelected = isC3Selected || isC4Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isSeaSkySelected ? isC4Selected ? "border-purple-500 shadow-lg bg-purple-50/30" : "border-cyan-500 shadow-lg bg-cyan-50/40" : "border-gray-200 hover:border-cyan-300"}`}>
                  <div className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">ウミガメシュノーケル＆ドローンSUP 海空セット</h3>
                          <span className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded-full font-bold">セットでお得</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">同じ浜で連続：ウミガメシュノーケル ＋ ドローンSUP</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />約3時間</span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {seaSkyPlans.map((plan) => {
                          const isPrivate = plan.id === "C4"
                          const isSelected = bookingData.selectedPlan === plan.id
                          return (
                            <label
                              key={plan.id}
                              className={`block cursor-pointer rounded-xl border-2 p-3 transition-all ${
                                isSelected
                                  ? isPrivate
                                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                                    : "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-100"
                                  : "border-gray-200 bg-white hover:border-cyan-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={isSelected}
                                onChange={(e) => handleInputChange("selectedPlan", e.target.value)}
                                className="sr-only"
                              />
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className={`text-xs font-bold ${isSelected && isPrivate ? "text-purple-700" : "text-gray-700"}`}>
                                  {isPrivate ? "貸切セット" : "通常セット"}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isPrivate ? "bg-purple-100 text-purple-700" : "bg-cyan-100 text-cyan-700"
                                }`}>
                                  {isPrivate ? "完全貸切" : "1,000円お得"}
                                </span>
                              </div>
                              <BookingPlanPrice planId={plan.id} />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット（通常・貸切） */}
            {(() => {
              const c5 = BOOKING_PLANS.find(p => p.id === "C5")
              const c6 = BOOKING_PLANS.find(p => p.id === "C6")
              const fullDayPlans = [c5, c6].filter(Boolean) as NonNullable<typeof c5>[]
              if (!fullDayPlans.length) return null
              const isC5Selected = bookingData.selectedPlan === "C5"
              const isC6Selected = bookingData.selectedPlan === "C6"
              const isFullDaySelected = isC5Selected || isC6Selected
              return (
                <div className={`rounded-2xl border-2 transition-all ${isFullDaySelected ? isC6Selected ? "border-purple-500 shadow-lg bg-purple-50/30" : "border-emerald-500 shadow-lg bg-emerald-50/40" : "border-gray-200 hover:border-emerald-300"}`}>
                  <div className="p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット</h3>
                          <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">3つでお得</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">朝：ウミガメ ＋ 昼：ドローンSUP ＋ 夜：ナイトツアー</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />朝〜夜の1日</span>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {fullDayPlans.map((plan) => {
                          const isPrivate = plan.id === "C6"
                          const isSelected = bookingData.selectedPlan === plan.id
                          return (
                            <label
                              key={plan.id}
                              className={`block cursor-pointer rounded-xl border-2 p-3 transition-all ${
                                isSelected
                                  ? isPrivate
                                    ? "border-purple-500 bg-purple-50 ring-2 ring-purple-100"
                                    : "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                                  : "border-gray-200 bg-white hover:border-emerald-300"
                              }`}
                            >
                              <input
                                type="radio"
                                name="plan"
                                value={plan.id}
                                checked={isSelected}
                                onChange={(e) => handleInputChange("selectedPlan", e.target.value)}
                                className="sr-only"
                              />
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className={`text-xs font-bold ${isSelected && isPrivate ? "text-purple-700" : "text-gray-700"}`}>
                                  {isPrivate ? "貸切セット" : "通常セット"}
                                </span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isPrivate ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                                }`}>
                                  {isPrivate ? "完全貸切" : "2,000円お得"}
                                </span>
                              </div>
                              <BookingPlanPrice planId={plan.id} />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* スライダーボートシュノーケル（近日公開） */}
            {(() => {
              const slideBoat = BOOKING_PLANS.find(p => p.id === "slide-boat")
              if (!slideBoat) return null

              return (
                <div className="rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/70">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">スライダーボートシュノーケル</h3>
                          <ComingSoonBadge />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{slideBoat.durationHours}時間</span>
                        </div>
                        <BookingPlanPrice planId="slide-boat" className="mt-2 max-w-xs" />
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-cyan-900">
                      滑り台付きボート・飛び込み台・ボートシュノーケルを準備中です。現在は予約受付前のため、このフォームでは選択できません。
                    </p>
                    <Link
                      href="/plans/slide-boat#coming-soon"
                      className="mt-3 inline-flex rounded-full bg-cyan-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-800"
                    >
                      詳細ページを見る
                    </Link>
                  </div>
                </div>
              )
            })()}
          </div>

          {selectedPlanData && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-2 text-sm">プラン詳細</h3>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">{selectedPlanData.description}</p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white/60 rounded-lg p-2">
                  <div className="text-gray-600 mb-0.5">対象年齢</div>
                  <div className="font-semibold text-gray-800">{selectedPlanData.ageRange}</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <div className="text-gray-600 mb-0.5">料金</div>
                  <BookingPlanPrice planId={selectedPlanData.id} className="mt-1" />
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
          <CardTitle as="h2" className="flex items-center gap-2 text-emerald-800">
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
            {!bookingData.selectedDate || !bookingData.selectedPlan ? (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">プランと日付を選択してください</div>
            ) : isComboPlan ? (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-emerald-800 mb-2">🐢 ウミガメツアー時間 *</p>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {COMBO_TURTLE_TIMES.map((time) => (
                      <Button
                        key={time}
                        type="button"
                        variant={bookingData.selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleInputChange("selectedTime", time)}
                        className={`rounded-xl ${
                          bookingData.selectedTime === time
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
                {planHasSup(bookingData.selectedPlan) && (
                  <div>
                    <p className="text-sm font-semibold text-cyan-800 mb-2">🛸 ドローンSUP時間</p>
                    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
                      ドローンSUPの開始時間は当日の海況・水位により調整し、予約確定時にLINEでご案内します。
                    </div>
                  </div>
                )}
                {planHasNight(bookingData.selectedPlan) && (
                  <div>
                    <p className="text-sm font-semibold text-indigo-800 mb-2">🦀 ヤシガニ探検（ナイトツアー）時間 *</p>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {COMBO_NIGHT_TIMES.map((time) => (
                        <Button
                          key={time}
                          type="button"
                          variant={bookingData.nightTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleInputChange("nightTime", time)}
                          className={`rounded-xl ${
                            bookingData.nightTime === time
                              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                              : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          }`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-indigo-700 mt-2">
                      ※23:20便は翌日0:50頃の解散予定です。予約日は23:20に開始する日をお選びください。
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {isTripleComboPlanId(bookingData.selectedPlan)
                    ? "朝のウミガメツアーと夜のヤシガニ探検の時間をお選びください。ドローンSUPは昼に連続開催し、時間は予約確定時にLINEでご案内します。海況・天候により変更になる場合があります。"
                    : planHasNight(bookingData.selectedPlan)
                      ? "昼のウミガメツアーと夜のヤシガニ探検、両方の時間をお選びください。海況・天候により時間が変更になる場合があります。"
                      : "ウミガメツアーの時間をお選びください。ドローンSUPの時間は予約確定時にLINEでご案内します。海況・天候により時間が変更になる場合があります。"}
                </p>
              </div>
            ) : (
              <>
                <BookingTimeSlots
                  selectedPlan={getPlanType(bookingData.selectedPlan)}
                  selectedDate={localDateFromYMD(bookingData.selectedDate)}
                  selectedTime={bookingData.selectedTime}
                  onPick={(time) => handleInputChange("selectedTime", time)}
                />
                {selectedPlanData && getPlanType(bookingData.selectedPlan) !== "sunset-sup" && getPlanType(bookingData.selectedPlan) !== "day-sup" && (
                  <p className="text-xs text-gray-500 mt-2">
                    選択中のプラン「{selectedPlanData.name}」の利用可能時間が表示されています
                    {getPlanType(bookingData.selectedPlan) === "night-hunter" && (
                      <span className="text-purple-600"> (夜間限定)</span>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participant Count */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-emerald-800">
            <Users className="w-5 h-5" />
            参加人数
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {bookingData.selectedPlan && !showUnder3 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                <strong>年齢制限:</strong> このプランは5歳以上のお客様が対象です。
                3歳以下のお子様は、3歳以下無料対象のナイトツアー（通常・貸切）で参加できます。
              </p>
            </div>
          )}

          {maxParticipants !== undefined && (
            <div className={`rounded-xl border p-4 ${isOverParticipantLimit ? "border-red-200 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
              <p className={`text-sm ${isOverParticipantLimit ? "text-red-800" : "text-blue-800"}`}>
                Web予約は最大{maxParticipants}名までです。現在{totalParticipantCount}名。
                11名以上はLINEでご相談ください。
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
                  disabled={isParticipantLimitReached}
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
                  disabled={isParticipantLimitReached}
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
                  3歳以下
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
                    disabled={isParticipantLimitReached}
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
                      3歳以下 {bookingData.under3Count}名 ×{" "}
                      {isUnder3FreePlan ? "無料" : `￥${childPrice.toLocaleString()}`}
                    </span>
                    <span>
                      {isUnder3FreePlan
                        ? "￥0"
                        : `￥${(bookingData.under3Count * childPrice).toLocaleString()}`}
                    </span>
                  </div>
                )}
                {(selectedPlanData?.vipSurcharge ?? 0) > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>貸切追加料金</span>
                    <span>￥{selectedPlanData!.vipSurcharge!.toLocaleString()}</span>
                  </div>
                )}
                {rentalCounts.wetsuit > 0 && (
                  <div className="flex justify-between text-cyan-700">
                    <span>ウェットスーツ {rentalCounts.wetsuit}名</span>
                    <span>
                      {rentalUnitPrice === 0
                        ? "料金に含む"
                        : `￥${(rentalCounts.wetsuit * rentalUnitPrice).toLocaleString()}`}
                    </span>
                  </div>
                )}
                {rentalCounts.prescriptionMask > 0 && (
                  <div className="flex justify-between text-cyan-700">
                    <span>度付きマスク {rentalCounts.prescriptionMask}名</span>
                    <span>
                      {rentalUnitPrice === 0
                        ? "料金に含む"
                        : `￥${(rentalCounts.prescriptionMask * rentalUnitPrice).toLocaleString()}`}
                    </span>
                  </div>
                )}
              </>
              {bookingData.selectedStaff && (
                <div className="flex justify-between text-emerald-600">
                  <span>スタッフ指名料</span>
                  <span>￥{getStaffFee(bookingData.selectedStaff).toLocaleString()}</span>
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

              {/* クーポンコード（セットプランは対象外） */}
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  クーポンコード
                </p>
                {isComboPlan ? (
                  <p className="text-xs text-gray-500 rounded-xl bg-gray-50 p-3">
                    このプランは既にセット割引（1名¥1,000お得）が適用されているため、クーポンはご利用いただけません。
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={bookingData.couponCode}
                        onChange={(e) => handleCouponCodeChange(e.target.value)}
                        className="rounded-xl border-emerald-200 focus:border-emerald-500"
                      />
                      <Button
                        type="button"
                        onClick={handleCouponApply}
                        disabled={isApplyingCoupon}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4"
                      >
                        {isApplyingCoupon ? "確認中..." : "適用"}
                      </Button>
                    </div>
                    {bookingData.couponDiscount > 0 && (
                      <p className="text-emerald-600 text-sm font-semibold mt-2">
                        🎉 クーポン適用済み！ -{bookingData.couponDiscount.toLocaleString()}円引き
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              <>
                {ageRestrictionMessage}
                <br />
                ※基本器材レンタル・保険料込み
                {(selectedPlanData?.vipSurcharge ?? 0) > 0 && (
                  <>
                    <br />
                    ※貸切プランは通常料金に追加で￥{selectedPlanData!.vipSurcharge!.toLocaleString()}
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
          <CardTitle as="h2" className="text-emerald-800">お客様情報</CardTitle>
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
              autoComplete="name"
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
              autoComplete="tel"
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
              autoComplete="email"
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
      {staffSelectable && (
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="flex items-center gap-2 text-emerald-800">
            <UserCheck className="w-5 h-5" />
            スタッフ指名（オプション）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>スタッフ指名について:</strong>
              <br />• お好みのスタッフを指名できます（追加料金はスタッフにより異なります）
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
                  {staff.id && ` (+¥${getStaffFee(staff.id).toLocaleString()})`}
                </option>
              ))}
            </select>
          </div>

          {bookingData.selectedStaff && (
            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                <strong>{STAFF_LIST.find((s) => s.id === bookingData.selectedStaff)?.name}</strong>を指名しました
                <br />
                <span className="text-emerald-600">指名料金: ¥{getStaffFee(bookingData.selectedStaff).toLocaleString()}</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Terms and Submit */}
      <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        {/* data属性は計測専用。送信できない状態でこの領域が押されたことの判定にだけ使う */}
        <CardContent className="p-6" data-booking-submit-area="">
          <div className="flex items-start space-x-3 mb-6">
            <Checkbox
              id="terms"
              checked={bookingData.agreedToTerms}
              onCheckedChange={(checked) => handleInputChange("agreedToTerms", checked === true)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                利用規約・キャンセルポリシー
              </a>
              および
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                プライバシーポリシー
              </a>
              に同意します。
              <br />
              <span className="text-xs text-gray-500">
                ※お支払いはツアー当日・現地での現金決済です。
                <br />
                ※前日までのキャンセルは無料です。
                <br />
                ※当日キャンセル・無断キャンセルは100%のキャンセル料が発生します。
                <br />
                ※悪天候による中止の場合、キャンセル料はかかりません。
              </span>
            </Label>
          </div>

          {hasSeniorOnRegularSnorkel && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold mb-1">60歳以上の方がいるため、このプランではご予約いただけません</p>
              <p>
                安全面を考慮し、60歳以上の方がご参加のグループは
                <strong>{seniorCounterpartName}</strong>
                のみのご案内となります。上部のプラン選択から貸切プランへ変更してください。
              </p>
            </div>
          )}

          {!isLiffReady && !!process.env.NEXT_PUBLIC_LIFF_ID && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-emerald-600">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              LINE情報を取得中...
            </div>
          )}

          {/* 未ログインのままフォーム下部まで来た人向けのログイン導線。
              ページ上部のバナーまで戻らせない（入力後の行き止まり防止） */}
          {!!process.env.NEXT_PUBLIC_LIFF_ID && isLiffReady && !hasFreshLineSession && !liffError && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-900">あと1ステップ：LINEログインで送信できます</p>
              <p className="mt-1 text-xs text-emerald-700">
                入力した内容は自動保存されています。ログインから戻ったあと、そのまま送信できます。
              </p>
              <button
                type="button"
                onClick={() => {
                  trackLineLoginClick({ location: "booking_bottom", locale: "ja" })
                  loginLiff()
                }}
                className="mt-3 w-full px-5 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                LINEでログイン
              </button>
            </div>
          )}

          {/* 「なぜ送信できないのか」を送信ボタンの直前で具体的に示す */}
          {missingItems.length > 0 && (
            <div
              ref={validationSummaryRef}
              id="booking-validation-summary"
              tabIndex={-1}
              className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 outline-none focus:ring-2 focus:ring-amber-400"
              role="status"
            >
              <p className="text-sm font-bold text-amber-900">送信まであと{missingItems.length}項目です</p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-800">
                {missingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              <p className="font-bold">送信結果を確認できませんでした</p>
              <p className="mt-1">{submitError}</p>
              <p className="mt-2 font-semibold">送信ボタンを連打せず、同じ内容のまま再送してください。</p>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            aria-describedby={missingItems.length > 0 ? "booking-validation-summary" : undefined}
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
