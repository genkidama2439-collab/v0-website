// ツアー情報の統合ビュー（読み取り専用・導出のみ）
// ============================================================
// 目的:
//   Webページ・SEO・JSON-LD・将来の llms.txt / MCP が「同じ1つの形」から
//   ツアー情報を読めるようにする。
//
// 設計上の約束（ここを破ると重複が1つ増えるだけになる）:
//   1. このファイルに**定数リテラルを書かない**。値はすべて既存モジュールから導出する。
//      - 料金        → lib/plan-price-display.ts（PLAN_PRICE_DATA）
//      - 本文・FAQ   → lib/plan-details.ts（PLAN_DETAILS）
//      - 参加条件    → lib/plan-flags.ts / lib/booking-rules.ts
//      - レンタル    → lib/rental-options.ts
//      - 開始時刻    → lib/data.ts（PLANS[].timeTags）＝ 予約APIが検証に使う値
//      - 多言語範囲  → lib/i18n/locales.ts
//   2. 導出できない情報は持たない。埋めない。推測しない。
//   3. 予約システム内部の値（LINE User ID・シートID・カレンダーID・NOTIFY_SECRET・
//      GAS内部のセット分割プラン名・売上按分ルール）は**絶対に入れない**。
//      AIへ公開する経路に流れるため。
//
// 現時点でこのモジュールを参照している本番コードはない（既存の描画は一切変更していない）。
// lib/tour-master.test.mjs が、既存ソースとの一致と情報の欠落を検査する。
//
// 詳細な調査結果と移行手順は docs/ai-readiness-audit.md を参照。
// ============================================================

import { PLANS } from "@/lib/data"
import { PLAN_DETAILS } from "@/lib/plan-details"
import { PLAN_PRICE_DATA } from "@/lib/plan-price-display"
import { getPlanMaxParticipants } from "@/lib/booking-rules"
import { getRentalUnitPrice, planOffersRentals } from "@/lib/rental-options"
import { INTL_LOCALES, INTL_PLAN_IDS, type IntlLocale } from "@/lib/i18n/locales"
import { SITE_URL } from "@/lib/seo"
import {
  COMBO_NIGHT_TIMES,
  FREE_UNDER3_PLAN_IDS,
  PRIVATE_COUNTERPART,
  SENIOR_RESTRICTED_PLAN_IDS,
  TIME_OPTIONAL_PLAN_IDS,
  getComboContentText,
  getParticipantAgeRange,
  isComboPlan,
  isNightTourPlan,
  isPrivatePlan,
  planHasNight,
} from "@/lib/plan-flags"

/** ツアーの大分類。プランIDと lib/plan-flags の判定から導出する。 */
export type TourCategory = "snorkel" | "night" | "sup" | "drone_sup" | "set" | "other"

export interface TourPricing {
  currency: "JPY"
  /** 大人1名あたり（クーポン適用前） */
  adult: number
  /** 子供1名あたり */
  child: number
  /** 3歳未満1名あたり。無料対象プランは 0 */
  under3: number
  /** レンタル1点あたり。貸切プランは 0 */
  rentalUnitPrice: number
  /** レンタルオプションの選択欄を出すか（ナイトツアーは提供なし） */
  rentalAvailable: boolean
}

export interface TourParticipants {
  adultAgeMin: number
  adultAgeMax: number
  childAgeMin: number
  childAgeMax: number
  under3Allowed: boolean
  /** Web予約1件あたりの上限。null = 上限を設けていない */
  maxPerWebBooking: number | null
  /** 60歳以上のグループは貸切版を案内する対象か */
  seniorRestricted: boolean
  /** 60歳以上の案内先プランID。対象外は null */
  seniorAlternativeId: string | null
  /**
   * ページに表示している対象年齢の文字列（例 "5〜65歳"）。
   * 上の数値条件とは別管理で、現状は一致していない（docs/ai-readiness-audit.md の M1）。
   * AIへ公開するときは数値条件を優先すること。
   */
  displayAgeRange: string
}

export interface TourSchedule {
  /** 予約APIが受理する開始時刻。空配列 = 時刻を指定しないプラン */
  startTimes: string[]
  /** セットプランの夜の部の開始時刻 */
  nightStartTimes: string[]
  /** false = 開始時刻が固定でなく、前日にLINEで確定する（サンセットSUP） */
  startTimeFixed: boolean
  durationHours: number
  /** ページに表示している所要時間の文字列 */
  durationLabel: string
}

export interface TourLocation {
  /** ページに表示している開催場所の説明 */
  label: string
  /** 候補地の名前。当日の海況で選ぶため確定ではない */
  candidates: string[]
  /** 集合場所が確定するタイミング */
  confirmedBy: "before_tour_line" | "on_page"
}

export interface TourContent {
  tagline: string
  summary: string
  highlights: string[]
  included: string[]
  whatToBring: string[]
  precautions: string[]
  /** ページに表示している集合時刻の案内 */
  meetingTime: string
  /** ページに表示している支払方法 */
  paymentMethod: string
  faqs: Array<{ question: string; answer: string }>
}

export interface TourSeo {
  url: string
  image: string
  metaTitle: string
  metaDescription: string
}

export interface TourVisibility {
  ja: boolean
  /** このプランを掲載している外国語ロケール */
  intlLocales: IntlLocale[]
  /**
   * AIへ公開してよいか。
   * このモジュールが持つ情報はすべて公開ページに載っているものだけなので現状は常に true。
   * 内部情報を足したくなった場合は、足す前にここで分岐させること。
   */
  exposeToAi: boolean
}

export interface TourMaster {
  // ---- 識別子 ----
  /** 内部ID。予約API・GAS・予約一覧シート45列目が使う。変更不可 */
  id: string
  /** URLセグメント（/plans/{slug}）。現状 id と同値。変更不可 */
  slug: string
  /** 予約APIへ送る planId。現状 id と同値 */
  bookingPlanId: string
  /**
   * 予約一覧シートF列へ実際に書き込まれるプラン名。
   * GASの名前判定（セット分割・LINE文面の切替）がこの値に依存しているため、
   * 変更するときはGAS側の対応が必要。docs/ai-readiness-audit.md の §6.3 を参照。
   */
  sheetPlanName: string

  // ---- 分類 ----
  status: "active" | "coming_soon"
  category: TourCategory
  isPrivate: boolean
  isSet: boolean
  /** セットに含まれる単品ツアーの説明（セット以外は空文字） */
  setContents: string

  // ---- 表示 ----
  displayName: string

  // ---- 各領域 ----
  pricing: TourPricing
  participants: TourParticipants
  schedule: TourSchedule
  location: TourLocation
  content: TourContent
  seo: TourSeo
  visibility: TourVisibility
}

function resolveCategory(planId: string): TourCategory {
  if (isComboPlan(planId)) return "set"
  if (isNightTourPlan(planId)) return "night"
  if (planId === "S6" || planId === "S7") return "drone_sup"
  if (planId === "S4" || planId === "S8") return "sup"
  if (planId === "S1" || planId === "S2") return "snorkel"
  return "other"
}

function resolvePricing(planId: string): TourPricing {
  const price = PLAN_PRICE_DATA[planId]
  const child = price.childPrice ?? price.price

  return {
    currency: "JPY",
    adult: price.price,
    child,
    under3: FREE_UNDER3_PLAN_IDS.has(planId) ? 0 : child,
    rentalUnitPrice: getRentalUnitPrice(planId),
    rentalAvailable: planOffersRentals(planId),
  }
}

function resolveParticipants(planId: string, displayAgeRange: string): TourParticipants {
  const adult = getParticipantAgeRange(planId, "adult")
  const child = getParticipantAgeRange(planId, "child")
  const under3 = getParticipantAgeRange(planId, "under3")
  const counterpart = PRIVATE_COUNTERPART[planId]

  return {
    adultAgeMin: adult?.min ?? 0,
    adultAgeMax: adult?.max ?? 0,
    childAgeMin: child?.min ?? 0,
    childAgeMax: child?.max ?? 0,
    under3Allowed: under3 !== null,
    maxPerWebBooking: getPlanMaxParticipants(planId) ?? null,
    seniorRestricted: SENIOR_RESTRICTED_PLAN_IDS.has(planId),
    seniorAlternativeId: counterpart?.id ?? null,
    displayAgeRange,
  }
}

function resolveSchedule(planId: string, durationLabel: string): TourSchedule {
  const plan = PLANS.find((candidate) => candidate.id === planId)

  return {
    // 予約APIは timeTags のうち HH:MM 形式だけを開始時刻として受理する（同じ絞り込み）
    startTimes: (plan?.timeTags ?? []).filter((tag) => /^\d{2}:\d{2}$/.test(tag)),
    nightStartTimes: planHasNight(planId) ? [...COMBO_NIGHT_TIMES] : [],
    startTimeFixed: !TIME_OPTIONAL_PLAN_IDS.has(planId),
    durationHours: plan?.durationHours ?? 0,
    durationLabel,
  }
}

function resolveLocation(planId: string): TourLocation {
  const detail = PLAN_DETAILS[planId]
  const candidates = (detail.locations ?? []).map((place) => place.name)

  return {
    label: detail.location,
    candidates,
    // 開始時刻が固定でないプラン（サンセットSUP）と、候補から当日選ぶプランは前日LINEで確定する
    confirmedBy:
      !TIME_OPTIONAL_PLAN_IDS.has(planId) && candidates.length === 0
        ? "on_page"
        : "before_tour_line",
  }
}

function resolveTour(planId: string): TourMaster {
  const detail = PLAN_DETAILS[planId]
  const plan = PLANS.find((candidate) => candidate.id === planId)

  return {
    id: planId,
    slug: planId,
    bookingPlanId: planId,
    // GASのシートへ実際に書かれる名前は PLANS[].name（= PLAN_DETAILS[].name から生成）
    sheetPlanName: plan?.name ?? detail.name,

    status: detail.status ?? "active",
    category: resolveCategory(planId),
    isPrivate: isPrivatePlan(planId),
    isSet: isComboPlan(planId),
    setContents: getComboContentText(planId),

    displayName: detail.name,

    pricing: resolvePricing(planId),
    participants: resolveParticipants(planId, detail.age),
    schedule: resolveSchedule(planId, detail.duration),
    location: resolveLocation(planId),

    content: {
      tagline: detail.tagline,
      summary: detail.heroDescription,
      highlights: detail.highlights.map((highlight) => highlight.title),
      included: detail.included,
      whatToBring: detail.whatToBring,
      precautions: detail.precautions,
      meetingTime: detail.meetingTime,
      paymentMethod: detail.paymentMethod,
      faqs: detail.faqs.map((faq) => ({ question: faq.q, answer: faq.a })),
    },

    seo: {
      url: `${SITE_URL}/plans/${planId}`,
      image: detail.image.startsWith("http") ? detail.image : `${SITE_URL}${detail.image}`,
      metaTitle: detail.name,
      metaDescription: detail.heroDescription,
    },

    visibility: {
      ja: true,
      intlLocales: INTL_PLAN_IDS.includes(planId) ? [...INTL_LOCALES] : [],
      exposeToAi: true,
    },
  }
}

/**
 * 全ツアーの統合ビュー。
 * 並び順は lib/data.ts の PLANS に合わせる（サイト上の掲載順と同じ）。
 */
export const TOUR_MASTER: TourMaster[] = PLANS.filter((plan) => PLAN_DETAILS[plan.id]).map((plan) =>
  resolveTour(plan.id),
)

export const TOUR_MASTER_BY_ID: Record<string, TourMaster> = Object.fromEntries(
  TOUR_MASTER.map((tour) => [tour.id, tour]),
)

export function getTour(planId: string): TourMaster | null {
  return TOUR_MASTER_BY_ID[planId] ?? null
}

/** AIへ公開してよいツアーだけを返す（llms.txt・MCP・AI Search用の入口） */
export function getPublicTours(): TourMaster[] {
  return TOUR_MASTER.filter((tour) => tour.visibility.exposeToAi)
}

/** 指定ロケールで掲載しているツアーを返す */
export function getToursForLocale(locale: "ja" | IntlLocale): TourMaster[] {
  if (locale === "ja") return TOUR_MASTER
  return TOUR_MASTER.filter((tour) => tour.visibility.intlLocales.includes(locale))
}
