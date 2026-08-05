// 予約ファネルの離脱地点を特定するための匿名計測。
//
// 設計方針
//  1. 予約機能には一切触らない。フォームの入力順序・必須条件・送信処理・料金計算は
//     変更せず、状態の変化を「観測」するだけ。
//  2. 個人情報を送れない構造にする。この層は値そのものを受け取らず、
//     区分（バケット・種別）へ変換したものだけを扱う。氏名・電話・メール・日付・
//     年齢・身長・体重・足サイズ・LINEの識別子やトークンは引数にも現れない。
//  3. 計測の失敗は握りつぶす。予約操作を絶対に止めない。
//  4. 画面の日本語文言を分析値に使わない。ステージ名は下の定数を単一ソースにする。

import type { AnalyticsEventProperties } from "@/lib/analytics-schema"
import { sendDetailedEvent, sendDetailedEventBeacon } from "@/lib/detailed-analytics"

// ============================================================
// ステージ
// ============================================================

export const BOOKING_STAGES = [
  "form_view",
  "line_login",
  "plan",
  "date",
  "time",
  "participants",
  "price",
  "representative",
  "participant_details",
  "submission",
  "completed",
] as const

export type BookingStage = (typeof BOOKING_STAGES)[number]

// ============================================================
// 区分（バケット）— 実値を送らないための変換
// ============================================================

export type BookingTiming =
  | "same_day"
  | "previous_day"
  | "2_to_3_days"
  | "4_to_7_days"
  | "8_to_30_days"
  | "31_days_or_more"
  | "unknown"

/** 参加日と当日の差を区分へ。実際の日付は返さない。 */
export function toBookingTiming(daysUntil: number): BookingTiming {
  if (!Number.isFinite(daysUntil)) return "unknown"
  if (daysUntil <= 0) return "same_day"
  if (daysUntil === 1) return "previous_day"
  if (daysUntil <= 3) return "2_to_3_days"
  if (daysUntil <= 7) return "4_to_7_days"
  if (daysUntil <= 30) return "8_to_30_days"
  return "31_days_or_more"
}

/** 参加日文字列から「何日後か」を求める。日付そのものは呼び出し側の外に出さない。 */
export function daysUntilDate(selectedDate: string, today: string): number {
  const parse = (value: string): number => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
    if (!match) return Number.NaN
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }

  const target = parse(selectedDate)
  const base = parse(today)
  if (Number.isNaN(target) || Number.isNaN(base)) return Number.NaN

  return Math.round((target - base) / 86_400_000)
}

export type GroupSizeBucket = "1" | "2" | "3_to_4" | "5_to_6" | "7_or_more" | "unknown"

export function toGroupSizeBucket(count: number): GroupSizeBucket {
  if (!Number.isFinite(count) || count <= 0) return "unknown"
  if (count === 1) return "1"
  if (count === 2) return "2"
  if (count <= 4) return "3_to_4"
  if (count <= 6) return "5_to_6"
  return "7_or_more"
}

export type ElapsedBucket =
  | "under_30s"
  | "30s_to_2m"
  | "2m_to_5m"
  | "5m_to_10m"
  | "10m_to_30m"
  | "over_30m"

export function toElapsedBucket(seconds: number): ElapsedBucket {
  if (!Number.isFinite(seconds) || seconds < 30) return "under_30s"
  if (seconds < 120) return "30s_to_2m"
  if (seconds < 300) return "2m_to_5m"
  if (seconds < 600) return "5m_to_10m"
  if (seconds < 1800) return "10m_to_30m"
  return "over_30m"
}

// ============================================================
// 種別
// ============================================================

export type FirstInteractionType =
  | "plan"
  | "date"
  | "time"
  | "participants"
  | "text_input"
  | "checkbox"
  | "unknown"

export type PlanSelectionSource =
  | "manual"
  | "url_parameter"
  | "article_cta"
  | "line"
  | "default"
  | "unknown"

export type RedirectMethod = "liff_login" | "external_browser" | "line_app" | "unknown"

export type LineReturnResult = "session_found" | "session_missing" | "provider_error" | "unknown"

export type FormRestoreResult =
  | "not_applicable"
  | "fully_restored"
  | "partially_restored"
  | "not_restored"
  | "unknown"

export type LineLoginErrorCategory =
  | "user_cancelled"
  | "provider_error"
  | "callback_error"
  | "missing_session"
  | "token_invalid"
  | "token_expired"
  | "return_path_error"
  | "unknown"

/** booking_failed の失敗段階。どこで落ちたかを区別する。 */
export type BookingFailureStage =
  | "client_validation"
  | "line_session"
  | "api_request"
  | "api_timeout"
  | "gas_response"
  | "server_validation"
  | "rate_limit"
  | "unknown"

/** HTTPステータスから失敗段階を求める。生のレスポンス内容は使わない。 */
export function toBookingFailureStage(status?: number): BookingFailureStage {
  if (status === undefined) return "api_request"
  if (status === 400 || status === 422) return "server_validation"
  if (status === 401 || status === 403) return "line_session"
  if (status === 429) return "rate_limit"
  if (status === 502 || status === 503 || status === 504) return "gas_response"
  if (status >= 500) return "gas_response"
  return "unknown"
}

/**
 * 不足項目の「種別」。画面に出る日本語文言ではなく、この一覧の値だけを送る。
 * 入力された値は含めない。
 */
export type MissingFieldCategory =
  | "line_authentication"
  | "plan"
  | "date"
  | "time"
  | "participant_count"
  | "representative_name"
  | "phone"
  | "participant_name"
  | "age"
  | "height"
  | "weight"
  | "foot_size"
  | "agreement"
  | "other"

export type ValidationActionType = "submit" | "next_step" | "unknown"

// ============================================================
// 重複防止
// ============================================================

// ページ表示〜離脱の範囲だけで使う一時的な状態。恒久的なユーザーIDは作らない。
// モジュールスコープに置くことで、React Strict Mode の二重実行・再レンダリング・
// コンポーネント再マウントを跨いで1回だけに保てる。
const firedOnce = new Set<string>()
const lastSignature = new Map<string, string>()

/** 同じキーで初回だけ true。React Strict Mode の二重呼び出しを吸収する。 */
export function claimOnce(key: string): boolean {
  if (firedOnce.has(key)) return false
  firedOnce.add(key)
  return true
}

/** 同じキーで「前回と違う内容のときだけ」true。値を戻した往復の再送信を防ぐ。 */
export function claimChanged(key: string, signature: string): boolean {
  if (lastSignature.get(key) === signature) return false
  lastSignature.set(key, signature)
  return true
}

/** テスト用。実行時には呼ばない。 */
export function resetFunnelDedupeForTest(): void {
  firedOnce.clear()
  lastSignature.clear()
}

// ============================================================
// LINEログインの外部遷移フラグ
// ============================================================

// LINE認証へ出ていく遷移を「離脱」と数えないためのフラグ。
// リダイレクトでページが破棄されるため sessionStorage にも残す。
const LINE_REDIRECT_FLAG = "booking-funnel-line-redirect"

let lineLoginRedirectInProgress = false

export function markLineLoginRedirectInProgress(): void {
  lineLoginRedirectInProgress = true
  try {
    window.sessionStorage.setItem(LINE_REDIRECT_FLAG, "1")
  } catch {
    // ストレージが使えなくてもメモリ側のフラグで当該ページの離脱判定は防げる
  }
}

export function isLineLoginRedirectInProgress(): boolean {
  if (lineLoginRedirectInProgress) return true
  try {
    return window.sessionStorage.getItem(LINE_REDIRECT_FLAG) === "1"
  } catch {
    return false
  }
}

/** LINEから戻ったあとに呼ぶ。戻り検知に使ったフラグを消す。 */
export function consumeLineLoginRedirectFlag(): boolean {
  const wasInProgress = isLineLoginRedirectInProgress()
  lineLoginRedirectInProgress = false
  try {
    window.sessionStorage.removeItem(LINE_REDIRECT_FLAG)
  } catch {
    // 消せなくても以降の判定はメモリ側で false になる
  }
  return wasInProgress
}

// ============================================================
// 送信
// ============================================================

/**
 * 計測は予約処理を絶対に妨げない。
 * 例外は握りつぶし、ユーザーへは何も表示せず、個人情報を console へ出さない。
 */
function safeSend(send: () => void): void {
  try {
    send()
  } catch {
    // 計測の失敗で予約操作を止めない
  }
}

function emit(name: Parameters<typeof sendDetailedEvent>[0], props: AnalyticsEventProperties): void {
  safeSend(() => sendDetailedEvent(name, props))
}

// ---- LINEログイン --------------------------------------------------------

/** 実際に認証URLへの遷移処理を開始できたときだけ呼ぶ。 */
export function trackLineLoginRedirectStarted(params: {
  redirectMethod: RedirectMethod
}): void {
  markLineLoginRedirectInProgress()
  emit("line_login_redirect_started", { redirect_method: params.redirectMethod })
}

/** LINE認証から戻ったと判定できたときに、成功・失敗にかかわらず呼ぶ。 */
export function trackLineLoginReturned(params: {
  returnPath: string
  returnResult: LineReturnResult
  hasLineSession: boolean
}): void {
  if (!claimOnce("line_login_returned")) return
  emit("line_login_returned", {
    return_path: params.returnPath,
    return_result: params.returnResult,
    line_logged_in: params.hasLineSession,
  })
}

/** 認証後に有効な新しいセッションを確認できたとき、1回だけ呼ぶ。 */
export function trackLineLoginSucceeded(params: {
  returnPath: string
  sessionFresh: boolean
  formRestored: FormRestoreResult
}): void {
  if (!claimOnce("line_login_succeeded")) return
  emit("line_login_succeeded", {
    return_path: params.returnPath,
    session_fresh: params.sessionFresh,
    form_restored: params.formRestored,
  })
}

/** コード上で明確に失敗と判定できた場合のみ呼ぶ。断定できないケースでは呼ばない。 */
export function trackLineLoginFailed(params: {
  errorCategory: LineLoginErrorCategory
  returnPath: string
}): void {
  if (!claimOnce(`line_login_failed:${params.errorCategory}`)) return
  emit("line_login_failed", {
    errorCategory: params.errorCategory,
    return_path: params.returnPath,
  })
}

// ---- 予約フォーム --------------------------------------------------------

export function trackBookingFormView(params: {
  locale: string
  lineAuthenticated: boolean
  source: string
}): void {
  if (!claimOnce("booking_form_view")) return
  emit("booking_form_view", {
    locale: params.locale,
    line_logged_in: params.lineAuthenticated,
    source: params.source,
  })
}

export function trackLineLoginClick(params: { location: string; locale: string }): void {
  emit("line_login_click", { location: params.location, locale: params.locale })
}

export function trackBookingStarted(params: {
  locale: string
  planId: string
  lineAuthenticated: boolean
  firstInteractionType: FirstInteractionType
}): void {
  if (!claimOnce("booking_started")) return
  emit("booking_started", {
    locale: params.locale,
    plan: params.planId,
    line_logged_in: params.lineAuthenticated,
    first_interaction_type: params.firstInteractionType,
  })
}

export function trackPlanSelected(params: {
  planId: string
  locale: string
  selectionSource: PlanSelectionSource
}): void {
  if (!claimChanged("booking_plan_selected", params.planId)) return
  emit("booking_plan_selected", {
    plan: params.planId,
    locale: params.locale,
    selection_source: params.selectionSource,
  })
}

export function trackDateSelected(params: {
  planId: string
  locale: string
  bookingTiming: BookingTiming
}): void {
  // 日付そのものは署名に使わない。区分が変わったときだけ送る。
  if (!claimChanged("booking_date_selected", `${params.planId}|${params.bookingTiming}`)) return
  emit("booking_date_selected", {
    plan: params.planId,
    locale: params.locale,
    booking_timing: params.bookingTiming,
  })
}

export function trackTimeSelected(params: {
  planId: string
  locale: string
  timeSlot: string
}): void {
  if (!claimChanged("booking_time_selected", `${params.planId}|${params.timeSlot}`)) return
  emit("booking_time_selected", {
    plan: params.planId,
    locale: params.locale,
    time_slot: params.timeSlot,
  })
}

export function trackParticipantsCompleted(params: {
  planId: string
  adultCount: number
  childCount: number
  under3Count: number
}): void {
  const participantCount = params.adultCount + params.childCount + params.under3Count
  const signature = `${params.planId}|${params.adultCount}|${params.childCount}|${params.under3Count}`
  if (!claimChanged("booking_participants_completed", signature)) return

  emit("booking_participants_completed", {
    plan: params.planId,
    adultCount: params.adultCount,
    childCount: params.childCount,
    under3Count: params.under3Count,
    headcount: participantCount,
    group_size_bucket: toGroupSizeBucket(participantCount),
  })
}

export function trackPriceConfirmed(params: {
  planId: string
  totalAmount: number
  couponApplied: boolean
  staffRequestApplied: boolean
  participantCount: number
}): void {
  const signature = `${params.planId}|${params.participantCount}|${params.totalAmount}`
  if (!claimChanged("booking_price_confirmed", signature)) return

  // クーポンコード・スタッフ名は送らない。適用の有無だけ。
  emit("booking_price_confirmed", {
    plan: params.planId,
    total: params.totalAmount,
    currency: "JPY",
    coupon_applied: params.couponApplied,
    staff_request_applied: params.staffRequestApplied,
  })
}

export function trackRepresentativeCompleted(params: {
  planId: string
  locale: string
  lineAuthenticated: boolean
  contactRequirementsCompleted: boolean
}): void {
  const signature = `${params.planId}|${params.lineAuthenticated}|${params.contactRequirementsCompleted}`
  if (!claimChanged("booking_representative_completed", signature)) return

  // 氏名・電話番号・メールの実値は送らない。充足しているかどうかだけ。
  emit("booking_representative_completed", {
    plan: params.planId,
    locale: params.locale,
    line_logged_in: params.lineAuthenticated,
    contact_requirements_completed: params.contactRequirementsCompleted,
  })
}

export function trackParticipantDetailsStarted(params: {
  planId: string
  participantCount: number
  locale: string
}): void {
  if (!claimOnce("booking_participant_details_started")) return
  emit("booking_participant_details_started", {
    plan: params.planId,
    headcount: params.participantCount,
    locale: params.locale,
  })
}

export function trackParticipantDetailsCompleted(params: {
  planId: string
  participantCount: number
  wetsuitRequested: number
  prescriptionMaskRequested: number
}): void {
  const signature = `${params.planId}|${params.participantCount}|${params.wetsuitRequested}|${params.prescriptionMaskRequested}`
  if (!claimChanged("booking_participant_details_completed", signature)) return

  // 参加者名・年齢・身長・体重・足サイズは送らない。レンタルは希望人数だけ。
  emit("booking_participant_details_completed", {
    plan: params.planId,
    headcount: params.participantCount,
    wetsuit_requested: params.wetsuitRequested,
    prescription_mask_requested: params.prescriptionMaskRequested,
  })
}

export function trackSubmitClicked(params: {
  planId: string
  participantCount: number
  totalAmount: number
  lineAuthenticated: boolean
  locale: string
}): void {
  emit("booking_submit_clicked", {
    plan: params.planId,
    headcount: params.participantCount,
    total: params.totalAmount,
    line_logged_in: params.lineAuthenticated,
    locale: params.locale,
  })
}

export function trackValidationError(params: {
  currentSection: BookingStage
  actionType: ValidationActionType
  missingFieldCategories: MissingFieldCategory[]
  planId: string
}): void {
  const categories = Array.from(new Set(params.missingFieldCategories)).sort()
  if (categories.length === 0) return

  const signature = `${params.actionType}|${categories.join(",")}`
  if (!claimChanged("booking_validation_error", signature)) return

  emit("booking_validation_error", {
    stage: params.currentSection,
    action_type: params.actionType,
    // 項目の「種別」だけ。入力値は含めない。
    missing_field_categories: categories.join(","),
    error_count: categories.length,
    plan: params.planId,
  })
}

/**
 * 離脱時に1回だけ。pagehide で呼ぶため sendBeacon 経路を使う。
 * LINE認証への遷移中は呼び出し側で除外する。
 */
export function trackBookingAbandoned(params: {
  lastCompletedStage: BookingStage
  currentStage: BookingStage
  planId: string
  elapsedSeconds: number
  participantCount: number
  lineAuthenticated: boolean
  locale: string
}): void {
  if (isLineLoginRedirectInProgress()) return
  if (!claimOnce("booking_abandoned")) return

  safeSend(() =>
    sendDetailedEventBeacon("booking_abandoned", {
      last_stage: params.lastCompletedStage,
      stage: params.currentStage,
      plan: params.planId,
      elapsed_seconds_bucket: toElapsedBucket(params.elapsedSeconds),
      participant_count_bucket: toGroupSizeBucket(params.participantCount),
      line_logged_in: params.lineAuthenticated,
      locale: params.locale,
    }),
  )
}
