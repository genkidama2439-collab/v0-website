"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ShieldCheck } from "lucide-react"

import {
  TRACKING_CONSENT_EVENT,
  TRACKING_PREFERENCES_EVENT,
  getTrackingConsentStatus,
  openTrackingPreferences,
  setTrackingConsent,
  type TrackingConsentStatus,
} from "@/lib/customer-tracking"
import { clearAttribution } from "@/lib/attribution"

type ConsentLocale = "ja" | "en" | "ko" | "zh-tw"

const COPY = {
  ja: {
    title: "閲覧履歴と予約情報の連携",
    body: "当サイトは、同意いただいた場合、最大395日使う識別子で閲覧ページ、流入元、フォーム操作を記録し、予約後に氏名・連絡先・参加者情報と紐付けてサービス改善と集客分析に利用します。拒否しても予約できます。",
    accept: "連携に同意する",
    decline: "必要な機能のみ",
    privacy: "プライバシーポリシー",
    settings: "データ取得設定",
  },
  en: {
    title: "Link browsing history with booking data",
    body: "With your consent, we use an identifier retained for up to 395 days to record pages viewed, referral sources, and booking-form activity. After a booking, we link this history with your name, contact details, and participant information for service and marketing analysis. You can still book if you decline.",
    accept: "Allow linked analytics",
    decline: "Necessary only",
    privacy: "Privacy Policy",
    settings: "Data settings",
  },
  ko: {
    title: "열람 기록과 예약 정보 연결",
    body: "동의하시면 최대 395일 보관되는 식별자를 사용해 열람 페이지, 유입 경로, 예약 양식 이용 내역을 기록하고 예약 후 성명·연락처·참가자 정보와 연결해 서비스 개선과 마케팅 분석에 사용합니다. 거부해도 예약할 수 있습니다.",
    accept: "연결 분석에 동의",
    decline: "필수 기능만",
    privacy: "개인정보 처리방침",
    settings: "데이터 설정",
  },
  "zh-tw": {
    title: "連結瀏覽記錄與預約資料",
    body: "經您同意，我們會使用最長保留395日的識別碼記錄瀏覽頁面、來源與預約表單操作，並在預約後與姓名、聯絡方式及參加者資料連結，用於改善服務與行銷分析。即使拒絕也仍可預約。",
    accept: "同意連結分析",
    decline: "僅必要功能",
    privacy: "隱私權政策",
    settings: "資料設定",
  },
} as const

function localeFromPath(pathname: string): ConsentLocale {
  if (pathname.startsWith("/en")) return "en"
  if (pathname.startsWith("/ko")) return "ko"
  if (pathname.startsWith("/zh-tw")) return "zh-tw"
  return "ja"
}

export function PrivacyConsent() {
  const pathname = usePathname()
  const locale = localeFromPath(pathname)
  const copy = COPY[locale]
  const privacyHref = locale === "ja" ? "/privacy" : `/${locale}/privacy`
  const [status, setStatus] = useState<TrackingConsentStatus>("unknown")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const current = getTrackingConsentStatus()
    setStatus(current)
    setOpen(current === "unknown")

    const onPreferences = () => setOpen(true)
    const onConsent = (event: Event) => {
      const next = (event as CustomEvent<{ status?: TrackingConsentStatus }>).detail?.status
      if (next) setStatus(next)
    }
    window.addEventListener(TRACKING_PREFERENCES_EVENT, onPreferences)
    window.addEventListener(TRACKING_CONSENT_EVENT, onConsent)
    return () => {
      window.removeEventListener(TRACKING_PREFERENCES_EVENT, onPreferences)
      window.removeEventListener(TRACKING_CONSENT_EVENT, onConsent)
    }
  }, [])

  const choose = (next: "accepted" | "declined") => {
    setTrackingConsent(next)
    if (next === "declined") clearAttribution()
    setStatus(next)
    setOpen(false)
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-consent-title"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-2xl border border-emerald-200 bg-white p-5 shadow-2xl sm:bottom-5 sm:p-6"
        >
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 flex-none text-emerald-700" aria-hidden="true" />
            <div>
              <h2 id="tracking-consent-title" className="text-base font-bold text-gray-900 sm:text-lg">{copy.title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{copy.body}</p>
              <Link href={privacyHref} className="mt-2 inline-block text-sm font-medium text-emerald-700 underline">
                {copy.privacy}
              </Link>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => choose("declined")}
              className="min-h-11 rounded-xl border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {copy.decline}
            </button>
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="min-h-11 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              {copy.accept}
            </button>
          </div>
        </section>
      )}
      {status !== "unknown" && !open && (
        <button
          type="button"
          onClick={openTrackingPreferences}
          className="fixed bottom-3 left-3 z-50 rounded-full border border-emerald-200 bg-white/95 px-3 py-2 text-xs font-medium text-emerald-800 shadow-md hover:bg-emerald-50"
        >
          {copy.settings}
        </button>
      )}
    </>
  )
}
