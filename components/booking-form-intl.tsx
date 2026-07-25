"use client"

// 国際版（en/ko/zh-tw共通）の予約フォーム。日本語版（booking-form.tsx）とは独立した軽量実装で、
// 同じ /api/booking に送信する（最終検証・料金計算はサーバー側が行う）。
// 文言はすべて props の dict から取り、実装はこの1本だけ。
// 辞書は booking-form-en/ko/zh-tw.tsx の薄いラッパーが自ロケール分だけ import して渡す
//（getDict をここで呼ぶと3言語全部がクライアントバンドルに入るため）。
// プランのルール（時間帯・年齢制限・足サイズ必須など）はサーバーの検証と一致させること —
// 予約ルールを変えるときは 日本語フォーム・このフォーム・API の3箇所を確認する。

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { CheckCircle, MessageCircle, Plus, Trash2 } from "lucide-react"
import { useLiff } from "@/components/liff-provider"
import { todayStr } from "@/lib/date-utils"
import { PLANS, getStaffFee } from "@/lib/data"
import type { IntlDict } from "@/lib/i18n/types"
import { type IntlLocale, LOCALE_BOOKING_TAGS, localePath } from "@/lib/i18n/locales"
import { getEnPrice } from "@/lib/i18n/en-prices"
import { SENIOR_RESTRICTED_PLAN_IDS, PRIVATE_COUNTERPART, TIME_OPTIONAL_PLAN_IDS, isParticipantAgeValid } from "@/lib/plan-flags"
import { getSunsetSupGuide } from "@/lib/beach-info"
import { categorizeBookingFailure, trackEvent } from "@/lib/analytics"
import { sendDetailedEvent } from "@/lib/detailed-analytics"
import { getAttribution, getAttributionSourceLabel } from "@/lib/attribution"
import { getPlanMaxParticipants } from "@/lib/booking-rules"
import {
  calculateRentalTotal,
  getRentalCounts,
  getRentalUnitPrice,
  planOffersRentals,
} from "@/lib/rental-options"

const NIGHT_PLAN_IDS = new Set(["S3", "S5"])
const FREE_UNDER3_PLAN_IDS = NIGHT_PLAN_IDS
const STAFF_AVAILABLE_PLAN_IDS = new Set(["S1", "S2"])
// スタッフ選択肢の表示順（"" = 指名なし）。名前の表記は辞書側。
const STAFF_ORDER = ["", "staff1", "staff2", "staff5", "staff3", "staff4"] as const

type Category = "adult" | "child" | "under3"

interface ParticipantIntl {
  id: string
  category: Category
  name: string
  age: number | ""
  height: number | ""
  weight: number | ""
  footSize: number | ""
  wetsuitRental: boolean
  prescriptionMaskRental: boolean
}

let participantSeq = 0

// LINE login (liff.login) round-trips through a redirect, which would wipe the
// form. Keep a draft of every field in sessionStorage and restore it on mount.
const draftKey = (locale: IntlLocale) => `booking-form-draft-${locale}`

interface IntlBookingDraft {
  planId?: string
  date?: string
  time?: string
  participants?: ParticipantIntl[]
  staffId?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  specialRequests?: string
  couponCode?: string
  couponDiscount?: number
  agreed?: boolean
}

function loadIntlBookingDraft(locale: IntlLocale): IntlBookingDraft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(draftKey(locale))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? (parsed as IntlBookingDraft) : null
  } catch {
    return null
  }
}

export function BookingFormIntl({ locale, dict }: { locale: IntlLocale; dict: IntlDict }) {
  const copy = dict.form
  const planById = dict.planById

  const searchParams = useSearchParams()
  const { lineIdToken, isLiffReady, isLiffLoggedIn, loginLiff, liffError, getFreshLineIdToken, invalidateLineSession } = useLiff()
  const liffRequired = !!process.env.NEXT_PUBLIC_LIFF_ID
  const hasFreshLineSession = isLiffLoggedIn && !!lineIdToken

  const bookablePlans = useMemo(
    () => PLANS.filter((p) => p.status !== "coming_soon" && planById[p.id]),
    [planById]
  )

  // LINEログインのリダイレクト前に保存した下書き（マウント時に一度だけ読む）。
  // このフォームはSuspense配下のクライアント描画のため、初期化はブラウザでのみ走る。
  const [draft] = useState<IntlBookingDraft | null>(() => loadIntlBookingDraft(locale))

  const initialPlan = searchParams.get("plan") || ""
  // URLの ?plan= が有効ならユーザーの直近の意図としてそちらを優先し、なければ下書きを復元
  const [planId, setPlanId] = useState(() => {
    if (bookablePlans.some((p) => p.id === initialPlan)) return initialPlan
    if (draft?.planId && bookablePlans.some((p) => p.id === draft.planId)) return draft.planId
    return ""
  })
  const [date, setDate] = useState(draft?.date ?? "")
  const [time, setTime] = useState(draft?.time ?? "")
  const [participants, setParticipants] = useState<ParticipantIntl[]>(() => {
    if (!Array.isArray(draft?.participants)) return []
    // 復元した参加者のID連番と、この後追加される参加者のIDが衝突しないよう進めておく
    for (const p of draft!.participants!) {
      const seq = Number(String(p.id).split("-").pop())
      if (Number.isFinite(seq) && seq > participantSeq) participantSeq = seq
    }
    return draft!.participants!.map((participant) => ({
      ...participant,
      wetsuitRental: participant.wetsuitRental === true,
      prescriptionMaskRental:
        participant.category === "adult" && participant.prescriptionMaskRental === true,
    }))
  })
  const [staffId, setStaffId] = useState(draft?.staffId ?? "")
  const [customerName, setCustomerName] = useState(draft?.customerName ?? "")
  const [customerEmail, setCustomerEmail] = useState(draft?.customerEmail ?? "")
  const [customerPhone, setCustomerPhone] = useState(draft?.customerPhone ?? "")
  const [specialRequests, setSpecialRequests] = useState(draft?.specialRequests ?? "")
  const [couponCode, setCouponCode] = useState(draft?.couponCode ?? "")
  // 割引額は人数・プランと紐づくため、保存値を復元せずサーバーで再検証する。
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [agreed, setAgreed] = useState(draft?.agreed ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [confirmedPricing, setConfirmedPricing] = useState<{ totalPrice: number; couponDiscount: number } | null>(null)
  const appliedCouponRef = useRef<{ code: string; signature: string } | null>(null)
  const submissionInFlightRef = useRef(false)
  const bookingStartedTrackedRef = useRef(false)

  // Move focus to the confirmation heading so screen-reader and keyboard
  // users reliably notice the form was sent.
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (isSubmitted) successHeadingRef.current?.focus()
  }, [isSubmitted])

  // フォーム表示を1回だけ計測（LIFF準備完了時点のログイン状態付き）
  const hasTrackedFormView = useRef(false)
  useEffect(() => {
    if (hasTrackedFormView.current || !isLiffReady) return
    hasTrackedFormView.current = true
    trackEvent("booking_form_view", { locale, line_logged_in: hasFreshLineSession, source: getAttributionSourceLabel() })
  }, [isLiffReady, hasFreshLineSession, locale])

  // 入力内容を随時sessionStorageへ退避（LINEログインのリダイレクトを跨いで復元するため）
  useEffect(() => {
    if (isSubmitted) return
    try {
      const draftToSave: IntlBookingDraft = {
        planId,
        date,
        time,
        participants,
        staffId,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests,
        couponCode,
        couponDiscount,
        agreed,
      }
      window.sessionStorage.setItem(draftKey(locale), JSON.stringify(draftToSave))
    } catch {}
  }, [planId, date, time, participants, staffId, customerName, customerEmail, customerPhone, specialRequests, couponCode, couponDiscount, agreed, isSubmitted, locale])

  const plan = bookablePlans.find((p) => p.id === planId)
  const t = planId ? planById[planId] : undefined
  const isNight = NIGHT_PLAN_IDS.has(planId)
  const timeOptional = TIME_OPTIONAL_PLAN_IDS.has(planId)
  const isDaySup = planId === "S6" || planId === "S7"
  const staffAvailable = STAFF_AVAILABLE_PLAN_IDS.has(planId)
  const timeOptions = plan ? plan.timeTags.filter((tag) => /^\d{2}:\d{2}$/.test(tag)) : []
  const maxParticipants = getPlanMaxParticipants(planId)
  const isOverParticipantLimit = maxParticipants !== undefined && participants.length > maxParticipants
  const isParticipantLimitReached = maxParticipants !== undefined && participants.length >= maxParticipants

  const childMinAge = isNight ? 4 : 5

  const counts = useMemo(
    () => ({
      adult: participants.filter((p) => p.category === "adult").length,
      child: participants.filter((p) => p.category === "child").length,
      under3: participants.filter((p) => p.category === "under3").length,
    }),
    [participants]
  )
  const rentalCounts = useMemo(() => getRentalCounts(participants), [participants])
  const rentalUnitPrice = getRentalUnitPrice(planId)
  const rentalTotal = calculateRentalTotal(planId, participants)

  const totalPrice = useMemo(() => {
    if (!plan) return 0
    // 国際版サイトは国際版価格（日本語＋¥2,000）で計算。サーバーも同じ getEnPrice で再計算する。
    const { price: adultPrice, childPrice } = getEnPrice(plan)
    const under3Price = FREE_UNDER3_PLAN_IDS.has(plan.id) ? 0 : childPrice
    const base = counts.adult * adultPrice + counts.child * childPrice + counts.under3 * under3Price
    const staffFee = staffAvailable ? getStaffFee(staffId) : 0
    return Math.max(0, base + (plan.vipSurcharge ?? 0) + staffFee + rentalTotal - couponDiscount)
  }, [plan, counts, staffId, staffAvailable, rentalTotal, couponDiscount])

  const addParticipant = (category: Category) => {
    if (isParticipantLimitReached) {
      toast.error(copy.limitToast(maxParticipants!))
      return
    }
    participantSeq += 1
    setParticipants((prev) => [
      ...prev,
      {
        id: `${locale}-${category}-${participantSeq}`,
        category,
        name: "",
        age: "",
        height: "",
        weight: "",
        footSize: "",
        wetsuitRental: false,
        prescriptionMaskRental: false,
      },
    ])
  }

  const removeParticipant = (id: string) => setParticipants((prev) => prev.filter((p) => p.id !== id))

  const updateParticipant = (id: string, field: keyof ParticipantIntl, value: ParticipantIntl[keyof ParticipantIntl]) =>
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))

  const handlePlanChange = (id: string) => {
    setPlanId(id)
    setTime("")
    setCouponDiscount(0)
    if (!STAFF_AVAILABLE_PLAN_IDS.has(id)) setStaffId("")
    if (!NIGHT_PLAN_IDS.has(id)) {
      setParticipants((prev) => prev.filter((p) => p.category !== "under3"))
    } else {
      setParticipants((prev) =>
        prev.map((participant) => ({
          ...participant,
          wetsuitRental: false,
          prescriptionMaskRental: false,
        })),
      )
    }
  }

  const handleCouponApply = async () => {
    setIsApplyingCoupon(true)
    try {
      const response = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode, adultCount: counts.adult, childCount: counts.child, planId }),
      })
      const result = await response.json().catch(() => ({ valid: false, discount: 0 }))
      if (response.ok && result.valid) {
        const normalizedCode = couponCode.trim()
        appliedCouponRef.current = {
          code: normalizedCode,
          signature: `${planId}|${counts.adult}|${counts.child}`,
        }
        setCouponDiscount(result.discount)
        toast.success(copy.couponAppliedToast)
      } else {
        appliedCouponRef.current = null
        setCouponDiscount(0)
        toast.error(copy.couponInvalid)
      }
    } catch {
      appliedCouponRef.current = null
      setCouponDiscount(0)
      toast.error(copy.couponNetworkError)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // 適用後の人数・プラン変更は、同じコードをサーバーで再計算する。
  useEffect(() => {
    const appliedCoupon = appliedCouponRef.current
    if (!appliedCoupon) return

    const signature = `${planId}|${counts.adult}|${counts.child}`
    if (signature === appliedCoupon.signature) return

    setCouponDiscount(0)
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setIsApplyingCoupon(true)
      try {
        const response = await fetch("/api/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            couponCode: appliedCoupon.code,
            adultCount: counts.adult,
            childCount: counts.child,
            planId,
          }),
        })
        const result = await response.json().catch(() => ({ valid: false, discount: 0 }))
        if (cancelled) return

        if (response.ok && result.valid) {
          appliedCouponRef.current = { ...appliedCoupon, signature }
          setCouponDiscount(result.discount)
        } else {
          appliedCouponRef.current = null
          setCouponDiscount(0)
          toast.error(result.error || copy.couponChangedInvalid)
        }
      } catch {
        if (!cancelled) {
          appliedCouponRef.current = null
          setCouponDiscount(0)
          toast.error(copy.couponRecalcError)
        }
      } finally {
        if (!cancelled) setIsApplyingCoupon(false)
      }
    }, 200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // copy は locale 固定で不変
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counts.adult, counts.child, planId])

  const handleCouponCodeChange = (value: string) => {
    appliedCouponRef.current = null
    setCouponCode(value)
    setCouponDiscount(0)
  }

  // グループ版プランは60歳以上お断り → 対応する貸切版へ案内（判定は lib/plan-flags が単一ソース）
  const seniorRestricted =
    SENIOR_RESTRICTED_PLAN_IDS.has(planId) && participants.some((p) => typeof p.age === "number" && p.age >= 60)
  const seniorCounterpart = PRIVATE_COUNTERPART[planId]
  const seniorCounterpartName = seniorCounterpart
    ? planById[seniorCounterpart.id]?.name ?? copy.seniorFallbackPlanName
    : ""

  const participantsValid = participants.every((p) => {
    if (!isParticipantAgeValid(planId, p.category, p.age)) return false
    if (!isNight && !(typeof p.footSize === "number" && p.footSize > 0)) return false
    return true
  })

  const isFormValid =
    !!plan &&
    !!date &&
    (timeOptional || !!time) &&
    counts.adult > 0 &&
    participants.length > 0 &&
    !isOverParticipantLimit &&
    participantsValid &&
    !seniorRestricted &&
    customerName.trim().length > 0 &&
    customerPhone.trim().length >= 10 &&
    agreed

  const needsLineLogin = liffRequired && !hasFreshLineSession

  // Spell out why the submit button is disabled (a human-readable mirror of
  // isFormValid). The 60+ restriction has its own red notice, so it's not listed.
  const missingItems: string[] = []
  if (!plan) missingItems.push(copy.missingChooseTour)
  if (!date) missingItems.push(copy.missingDate)
  if (!timeOptional && !time) missingItems.push(copy.missingTime)
  if (participants.length === 0) missingItems.push(copy.missingAddGuest)
  else if (counts.adult === 0) missingItems.push(copy.missingAdult)
  if (isOverParticipantLimit && maxParticipants !== undefined) {
    missingItems.push(copy.missingReduceGroup(maxParticipants))
  }
  participants.forEach((p, index) => {
    if (!isParticipantAgeValid(planId, p.category, p.age)) missingItems.push(copy.missingAgeFor(index + 1))
    if (!isNight && !(typeof p.footSize === "number" && p.footSize > 0)) missingItems.push(copy.missingShoeFor(index + 1))
  })
  if (customerName.trim().length === 0) missingItems.push(copy.missingFullName)
  if (customerPhone.trim().length < 10) missingItems.push(copy.missingPhone)
  if (!agreed) missingItems.push(copy.missingAgree)
  if (needsLineLogin) missingItems.push(copy.missingLineLogin)

  const bookingTag = LOCALE_BOOKING_TAGS[locale]

  const trackBookingStarted = () => {
    if (bookingStartedTrackedRef.current) return

    bookingStartedTrackedRef.current = true
    sendDetailedEvent("booking_started", {
      locale,
      plan: planId,
      planName: t?.name ?? plan?.name ?? "",
      headcount: participants.length,
      adultCount: counts.adult,
      childCount: counts.child,
      under3Count: counts.under3,
      total: totalPrice,
      currency: "JPY",
      source: getAttributionSourceLabel(),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submissionInFlightRef.current) return
    if (!plan || !t) return

    // LINE ID tokens expire ~1 hour after login and LIFF never refreshes them,
    // so validate right before sending. On expiry the session is cleared and the
    // form falls back to the LINE login prompt (entries are auto-saved).
    const freshLineIdToken = getFreshLineIdToken()
    if (liffRequired && !freshLineIdToken) {
      toast.error(copy.lineExpiredError)
      return
    }
    submissionInFlightRef.current = true
    setIsSubmitting(true)
    let failureCategory = categorizeBookingFailure()
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPlan: plan.id,
          selectedDate: date,
          selectedTime: time,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          planName: plan.name,
          locale,
          selectedStaff: staffAvailable ? staffId || undefined : undefined,
          participants: participants.map((p, i) => ({
            ...p,
            name: p.name.trim() === "" ? copy.defaultGuestName(i + 1) : p.name.trim(),
            wetsuitRental: planOffersRentals(plan.id) && p.wetsuitRental === true,
            prescriptionMaskRental:
              planOffersRentals(plan.id) &&
              p.category === "adult" &&
              p.prescriptionMaskRental === true,
          })),
          totalPrice,
          specialRequests: specialRequests.trim()
            ? `${bookingTag} ${specialRequests.trim()}`
            : `${bookingTag} ${copy.bookedViaSite}`,
          lineIdToken: freshLineIdToken,
          couponCode,
          couponDiscount,
          agreedToTerms: agreed,
          // 流入元（どのリンク経由か）。管理者メール・カレンダーの備考に [流入元] として載る
          attribution: getAttribution(),
        }),
      })
      failureCategory = categorizeBookingFailure(response.status)
      const responseData: {
        success?: boolean
        data?: { totalPrice?: unknown; couponDiscount?: unknown }
      } | null = await response.json().catch(() => null)
      if (!response.ok || responseData?.success !== true) {
        if (response.status === 401) {
          // The server rejected the LINE credentials → drop the stale session
          // so the form shows the LINE login prompt again.
          invalidateLineSession()
          throw new Error(copy.lineExpiredError)
        }
        throw new Error(copy.submitFailedError)
      }
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
          : couponDiscount
      setConfirmedPricing({ totalPrice: confirmedTotalPrice, couponDiscount: confirmedCouponDiscount })
      sendDetailedEvent("booking_submitted", {
        locale,
        plan: planId,
        planName: plan.name,
        headcount: participants.length,
        adultCount: counts.adult,
        childCount: counts.child,
        under3Count: counts.under3,
        total: confirmedTotalPrice,
        currency: "JPY",
        source: getAttributionSourceLabel(),
        outcome: "success",
      })
      try {
        window.sessionStorage.removeItem(draftKey(locale))
      } catch {}
      setIsSubmitted(true)
    } catch (error) {
      sendDetailedEvent("booking_failed", {
        locale,
        plan: planId,
        planName: t?.name ?? plan?.name ?? "",
        headcount: participants.length,
        adultCount: counts.adult,
        childCount: counts.child,
        under3Count: counts.under3,
        total: totalPrice,
        currency: "JPY",
        source: getAttributionSourceLabel(),
        outcome: "failed",
        errorCategory: failureCategory,
      })
      toast.error(error instanceof Error ? error.message : copy.genericError)
    } finally {
      submissionInFlightRef.current = false
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="bg-white/95 rounded-3xl ring-1 ring-emerald-100 shadow-2xl max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 ref={successHeadingRef} tabIndex={-1} className="text-2xl font-bold text-emerald-800 mb-4 outline-none">{copy.successTitle}</h2>
          <p className="text-gray-600 mb-6">
            {copy.successBody.text}
            <br />
            <strong>{copy.successBody.strong}</strong>
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6 text-left text-sm text-gray-700">
            <p>{copy.successTourLabel}{t?.name}</p>
            <p>
              {copy.successDateLabel}{date}{" "}
              {timeOptional ? copy.successSunsetNote : time}
            </p>
            <p>{copy.successGuestsLabel}{participants.length}</p>
            {((confirmedPricing?.couponDiscount ?? couponDiscount) > 0) && (
              <p>{copy.successCouponLabel}-¥{(confirmedPricing?.couponDiscount ?? couponDiscount).toLocaleString()}</p>
            )}
            <p>{copy.successTotalPrefix}¥{(confirmedPricing?.totalPrice ?? totalPrice).toLocaleString()}{copy.successTotalSuffix}</p>
          </div>
          {/* Confirmation is sent as a LINE push message, which only reaches users
              who have added the official account as a friend. Prompt it as the top priority. */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-bold text-amber-900">{copy.addFriendBox.title}</p>
            <p className="mt-2 text-sm text-amber-900">
              {copy.addFriendBox.bodyPre}
              <strong>{copy.addFriendBox.bodyStrong1}</strong>
              {copy.addFriendBox.bodyMid}
              <strong>{copy.addFriendBox.bodyStrong2}</strong>
              {copy.addFriendBox.bodyPost}
            </p>
            <p className="mt-1 text-xs text-amber-700">{copy.addFriendBox.note}</p>
            <a
              href="https://lin.ee/jfp4laz"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 w-full bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-bold rounded-lg px-5 py-3 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
              {copy.addFriendBox.button}
            </a>
          </div>
          <Link href={localePath(locale, "/")} className="text-emerald-700 underline font-semibold">
            {copy.backHome}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} onInputCapture={trackBookingStarted} className="space-y-8">
      {/* Plan */}
      <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="text-emerald-800">1. {copy.sectionChooseTour}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bookablePlans.map((p) => {
            const pt = planById[p.id]
            const selected = planId === p.id
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => handlePlanChange(p.id)}
                className={`text-left rounded-2xl border-2 p-4 transition-colors ${
                  selected ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="block font-bold text-gray-900 text-sm">{pt.name}</span>
                <span className="block text-xs text-gray-500 mt-1">
                  ¥{getEnPrice(p).price.toLocaleString()} {dict.common.perAdult} ・ {pt.ageNote}
                </span>
              </button>
            )
          })}
        </CardContent>
      </Card>

      {/* Date & time */}
      <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="text-emerald-800">2. {copy.sectionDateTime}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intl-date" className="text-sm font-medium text-gray-700 mb-2 block">
              {copy.dateLabel}
            </Label>
            <Input
              id="intl-date"
              type="date"
              required
              min={todayStr()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border-emerald-200"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              {copy.startTimeLabel} {timeOptional ? copy.startTimeSunset : "*"}
            </Label>
            {timeOptional ? (
              <p className="text-sm text-gray-500 leading-relaxed pt-2">
                {copy.sunsetNote}
                {(() => {
                  // 日付選択後は、その月の集合・解散目安を追記（単一ソース: lib/beach-info.ts）
                  const month = Number(date.split("-")[1])
                  if (!month || month < 1 || month > 12) return null
                  const guide = getSunsetSupGuide(month)
                  return (
                    <>
                      <br />
                      <span className="font-semibold text-gray-700">{copy.sunsetDateGuide(month, guide.meet, guide.end)}</span>
                    </>
                  )
                })()}
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {(timeOptions.length > 0 ? timeOptions : []).map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setTime(tag)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                        time === tag ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:border-emerald-300"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {!plan && <p className="text-sm text-gray-400 pt-2">{copy.chooseTourFirst}</p>}
                </div>
                {isDaySup && (
                  <p className="text-xs text-gray-500 mt-2">
                    {copy.daySupNote}
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Participants */}
      <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="text-emerald-800">3. {copy.sectionParticipants}</CardTitle>
          <p className="text-sm text-gray-600">
            {copy.participantsIntroBase} {isNight ? "" : copy.participantsIntroShoe}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isParticipantLimitReached} onClick={() => addParticipant("adult")} className="rounded-full border-emerald-300 text-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> {copy.addAdult}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isParticipantLimitReached} onClick={() => addParticipant("child")} className="rounded-full border-emerald-300 text-emerald-700">
              <Plus className="w-4 h-4 mr-1" /> {copy.addChild(childMinAge)}
            </Button>
            {isNight && (
              <Button type="button" variant="outline" size="sm" disabled={isParticipantLimitReached} onClick={() => addParticipant("under3")} className="rounded-full border-emerald-300 text-emerald-700">
                <Plus className="w-4 h-4 mr-1" /> {copy.addUnder3}
              </Button>
            )}
          </div>

          {maxParticipants !== undefined && (
            <p className={`rounded-xl border p-3 text-sm ${isOverParticipantLimit ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
              {copy.groupLimitInfo(maxParticipants, participants.length)}
            </p>
          )}

          {participants.map((p, index) => (
            <div key={p.id} className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-emerald-800 text-sm">
                  {copy.guestHeading(index + 1, copy.guestCategoryLabel[p.category])}
                </h3>
                <button type="button" onClick={() => removeParticipant(p.id)} aria-label={copy.removeGuestAria(index + 1)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <Label htmlFor={`intl-p-${p.id}-name`} className="text-xs text-gray-600 mb-1 block">{copy.nameLabel}</Label>
                  <Input id={`intl-p-${p.id}-name`} value={p.name} onChange={(e) => updateParticipant(p.id, "name", e.target.value)} className="rounded-xl border-emerald-200" />
                </div>
                <div>
                  <Label htmlFor={`intl-p-${p.id}-age`} className="text-xs text-gray-600 mb-1 block">{copy.ageLabel}</Label>
                  <Input
                    id={`intl-p-${p.id}-age`}
                    type="number"
                    required
                    min={p.category === "under3" ? 0 : p.category === "child" ? childMinAge : 13}
                    max={p.category === "under3" ? 3 : p.category === "child" ? 12 : 100}
                    value={p.age}
                    onChange={(e) => updateParticipant(p.id, "age", e.target.value === "" ? "" : Number.parseInt(e.target.value))}
                    className="rounded-xl border-emerald-200"
                  />
                </div>
                {!isNight && (
                  <>
                    <div>
                      <Label htmlFor={`intl-p-${p.id}-height`} className="text-xs text-gray-600 mb-1 block">{copy.heightLabel}</Label>
                      <Input id={`intl-p-${p.id}-height`} type="number" min={50} max={220} value={p.height} onChange={(e) => updateParticipant(p.id, "height", e.target.value === "" ? "" : Number.parseInt(e.target.value))} className="rounded-xl border-emerald-200" />
                    </div>
                    <div>
                      <Label htmlFor={`intl-p-${p.id}-weight`} className="text-xs text-gray-600 mb-1 block">{copy.weightLabel}</Label>
                      <Input id={`intl-p-${p.id}-weight`} type="number" min={5} max={150} value={p.weight} onChange={(e) => updateParticipant(p.id, "weight", e.target.value === "" ? "" : Number.parseInt(e.target.value))} className="rounded-xl border-emerald-200" />
                    </div>
                    <div>
                      <Label htmlFor={`intl-p-${p.id}-foot`} className="text-xs text-gray-600 mb-1 block">{copy.shoeLabel}</Label>
                      <Input
                        id={`intl-p-${p.id}-foot`}
                        type="number"
                        required
                        step="0.5"
                        min={10}
                        max={35}
                        placeholder={copy.shoePlaceholder}
                        value={p.footSize}
                        onChange={(e) => updateParticipant(p.id, "footSize", e.target.value === "" ? "" : Number.parseFloat(e.target.value))}
                        className="rounded-xl border-emerald-200"
                      />
                    </div>
                  </>
                )}
              </div>

              {planOffersRentals(planId) && (
                <div className="mt-4 rounded-xl border border-cyan-200 bg-cyan-50/70 p-3">
                  <p className="mb-3 text-sm font-semibold text-cyan-900">{copy.rentalHeading}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`intl-p-${p.id}-wetsuit`}
                        checked={p.wetsuitRental === true}
                        onCheckedChange={(checked) =>
                          updateParticipant(p.id, "wetsuitRental", checked === true)
                        }
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`intl-p-${p.id}-wetsuit`}
                        className="cursor-pointer text-sm leading-relaxed text-gray-700"
                      >
                        {copy.wetsuitRentalLabel}{" "}
                        <span className="font-semibold text-cyan-700">
                          ({rentalUnitPrice === 0
                            ? copy.rentalIncludedLabel
                            : copy.rentalPriceLabel(rentalUnitPrice.toLocaleString())})
                        </span>
                      </Label>
                    </div>

                    {p.category === "adult" ? (
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`intl-p-${p.id}-prescription-mask`}
                          checked={p.prescriptionMaskRental === true}
                          onCheckedChange={(checked) =>
                            updateParticipant(p.id, "prescriptionMaskRental", checked === true)
                          }
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`intl-p-${p.id}-prescription-mask`}
                          className="cursor-pointer text-sm leading-relaxed text-gray-700"
                        >
                          {copy.prescriptionMaskRentalLabel}{" "}
                          <span className="font-semibold text-cyan-700">
                            ({rentalUnitPrice === 0
                              ? copy.rentalIncludedLabel
                              : copy.rentalPriceLabel(rentalUnitPrice.toLocaleString())})
                          </span>
                        </Label>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-amber-700">
                        {copy.prescriptionMaskAdultsOnly}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {participants.length > 0 && counts.adult === 0 && (
            <p className="text-sm text-red-600">{copy.needAdultError}</p>
          )}
          {seniorRestricted && seniorCounterpart && (
            <p className="text-sm text-red-600">
              {copy.seniorNotice.before}
              <Link href={localePath(locale, `/plans/${seniorCounterpart.id}`)} className="underline font-semibold">
                {seniorCounterpartName}
              </Link>
              {copy.seniorNotice.after}
            </p>
          )}
          {!isNight && participants.length > 0 && (
            <p className="text-xs text-gray-500">
              {copy.shoeConversionNote}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Staff nomination */}
      {staffAvailable && (
        <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
          <CardHeader>
            <CardTitle as="h2" className="text-emerald-800">4. {copy.sectionStaff}</CardTitle>
            <p className="text-sm text-gray-600">{copy.staffIntro}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {STAFF_ORDER.map((sid) => (
              <button
                type="button"
                key={sid || "none"}
                onClick={() => setStaffId(sid)}
                className={`px-4 py-2 rounded-full border-2 text-sm font-semibold transition-colors ${
                  staffId === sid ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "border-gray-200 text-gray-600 hover:border-emerald-300"
                }`}
              >
                {sid === "" ? copy.staffNoPreference : copy.staffNames[sid]}
                {sid && <span className="ml-1 text-xs opacity-70">+¥{getStaffFee(sid).toLocaleString()}</span>}
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardHeader>
          <CardTitle as="h2" className="text-emerald-800">{staffAvailable ? "5" : "4"}. {copy.sectionContact}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intl-name" className="text-sm font-medium text-gray-700 mb-2 block">{copy.fullNameLabel}</Label>
            <Input id="intl-name" required autoComplete="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-xl border-emerald-200" />
          </div>
          <div>
            <Label htmlFor="intl-phone" className="text-sm font-medium text-gray-700 mb-2 block">{copy.phoneLabel}</Label>
            <Input id="intl-phone" type="tel" required autoComplete="tel" placeholder={copy.phonePlaceholder} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="rounded-xl border-emerald-200" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="intl-email" className="text-sm font-medium text-gray-700 mb-2 block">{copy.emailLabel}</Label>
            <Input id="intl-email" type="email" autoComplete="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="rounded-xl border-emerald-200" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="intl-requests" className="text-sm font-medium text-gray-700 mb-2 block">{copy.requestsLabel}</Label>
            <Textarea id="intl-requests" rows={3} value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} className="rounded-xl border-emerald-200" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">{copy.couponLabel}</Label>
            <div className="flex gap-2">
              <Input value={couponCode} onChange={(e) => handleCouponCodeChange(e.target.value)} className="rounded-xl border-emerald-200" />
              <Button type="button" onClick={handleCouponApply} disabled={isApplyingCoupon} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4">
                {isApplyingCoupon ? copy.couponChecking : copy.couponApply}
              </Button>
            </div>
            {couponDiscount > 0 && (
              <p className="text-emerald-600 text-sm font-semibold mt-2">{copy.couponAppliedLine(couponDiscount.toLocaleString())}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary & submit */}
      <Card className="bg-white/80 rounded-3xl ring-1 ring-emerald-100 shadow-lg">
        <CardContent className="p-6 space-y-5">
          {plan && participants.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl p-4 text-sm text-gray-700 space-y-1">
              <p className="font-bold text-emerald-800">{t?.name}</p>
              <p>{copy.partySummary(counts)}</p>
              {staffId && staffAvailable && <p>{copy.guideFeeLine(getStaffFee(staffId).toLocaleString())}</p>}
              {(rentalCounts.wetsuit > 0 || rentalCounts.prescriptionMask > 0) && (
                <p>
                  {copy.rentalSummary(rentalCounts.wetsuit, rentalCounts.prescriptionMask)}
                  {rentalUnitPrice === 0
                    ? ` (${copy.rentalIncludedLabel})`
                    : `: +¥${rentalTotal.toLocaleString()}`}
                </p>
              )}
              {couponDiscount > 0 && <p>{copy.successCouponLabel}-¥{couponDiscount.toLocaleString()}</p>}
              <p className="font-black text-lg text-emerald-800">
                {copy.estimatedTotalLabel} ¥{totalPrice.toLocaleString()}
                <span className="text-xs font-medium text-gray-500 ml-2">{copy.cashOnDay}</span>
              </p>
              {/* 貸切限定である理由と使用言語。送信直前にもう一度提示する */}
              <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t border-emerald-100">{dict.priceSupportNote}</p>
            </div>
          )}

          <div className="flex items-start space-x-3">
            <Checkbox id="intl-terms" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} className="mt-1" />
            <Label htmlFor="intl-terms" className="text-sm text-gray-600 leading-relaxed">
              {copy.agreeText.before}
              <a href={localePath(locale, "/terms")} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                {copy.agreeText.termsLabel}
              </a>
              {copy.agreeText.between}
              <a href={localePath(locale, "/privacy")} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
                {copy.agreeText.privacyLabel}
              </a>
              {copy.agreeText.after}
              <br />
              <span className="text-xs text-gray-500">
                {copy.cancellationSmallPrint}
              </span>
            </Label>
          </div>

          {needsLineLogin && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                {copy.lineLoginHeading}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                {copy.lineLoginBody.before}
                <a href="mailto:info@umigamekyoudaimiyakojima.com" className="text-emerald-700 underline">
                  info@umigamekyoudaimiyakojima.com
                </a>
                {copy.lineLoginBody.after}
              </p>
              <Button
                type="button"
                onClick={() => {
                  trackEvent("line_login_click", { location: `booking_${locale}` })
                  loginLiff()
                }}
                disabled={!isLiffReady}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
              >
                {isLiffReady ? copy.lineLoginButton : copy.lineConnecting}
              </Button>
              {liffError && <p className="text-xs text-red-600 mt-2">{copy.lineErrorPrefix}{liffError}</p>}
            </div>
          )}

          {/* Show exactly what's still needed, right above the submit button */}
          {missingItems.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4" role="status">
              <p className="text-sm font-bold text-amber-900">
                {copy.missingHeading(missingItems.length)}
              </p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-800">
                {missingItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting || needsLineLogin}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg py-6 rounded-2xl disabled:opacity-50"
          >
            {isSubmitting ? copy.submitSending : copy.submitLabel}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            {copy.requestNote}
          </p>
          <p className="text-xs font-medium text-amber-700 text-center">
            {copy.addFriendWarning.before}
            <a href="https://lin.ee/jfp4laz" target="_blank" rel="noopener noreferrer" className="underline font-bold">{copy.addFriendWarning.linkText}</a>
            {copy.addFriendWarning.after}
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
