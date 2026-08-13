export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "page_engagement",
  "scroll_depth",
  "external_link_click",
  "language_change",
  "web_vital",
  "booking_started",
  "book_cta_click",
  "line_click",
  "line_add_friend_click",
  "phone_click",
  "booking_form_view",
  "line_login_click",
  "booking_submitted",
  "booking_failed",
  // 予約ファネルの離脱地点を特定するための計測。
  // 予約フォームの挙動・入力順序・必須条件は変えず、フックとして値を送るだけ。
  "line_login_redirect_started",
  "line_login_returned",
  "line_login_succeeded",
  "line_login_failed",
  "booking_plan_selected",
  "booking_date_selected",
  "booking_time_selected",
  "booking_participants_completed",
  "booking_price_confirmed",
  "booking_representative_completed",
  "booking_participant_details_started",
  "booking_participant_details_completed",
  "booking_submit_clicked",
  "booking_validation_error",
  "booking_abandoned",
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export type AnalyticsValue = string | number | boolean | null

export type AnalyticsEventProperties = Record<string, AnalyticsValue>

export interface DetailedAnalyticsEvent {
  event_name: AnalyticsEventName
  visitor_id: string
  visit_id: string
  booking_funnel_id: string
  consent_version: string
  consented_at: string
  page_path: string
  locale: string
  device_type: string
  viewport_width: number
  viewport_height: number
  referrer_host: string
  landing_page: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
  browser: string
  os: string
  screen_width: number
  screen_height: number
  connection_type: string
  properties: AnalyticsEventProperties
}

export const ANALYTICS_PROPERTY_KEYS = [
  "location",
  "plan",
  "planName",
  // ブログ記事内CTAの計測。location にCTA設置位置（article_top 等）、
  // ctaType に種類（booking / plan_detail / line 等）、ctaLabel にボタン文言が入る。
  // 記事URLは event.page_path、キャンペーンは utm_campaign / utm_content で判別する。
  "ctaType",
  "ctaLabel",
  // 予約完了イベントと予約シートを正確に結合する。
  // visitor_id 等の識別子は DetailedAnalyticsEvent 直下の共通項目に持つ。
  "booking_id",
  "line_ready",
  // ---- 予約ファネル計測 ----------------------------------------------------
  // すべて値そのものではなく「区分」だけを持つ。氏名・電話・日付・年齢・体格・
  // LINEの識別子やトークンは絶対に入れない（lib/booking-funnel.ts で組み立てる）。
  // 記事の仕様でいう plan_id は既存の plan、participant_count は headcount、
  // total_amount は total、line_authenticated は line_logged_in を再利用する。
  "stage",
  "last_stage",
  "redirect_method",
  "return_path",
  "return_result",
  "session_fresh",
  "form_restored",
  "first_interaction_type",
  "selection_source",
  "booking_timing",
  "time_slot",
  "group_size_bucket",
  "coupon_applied",
  "staff_request_applied",
  "contact_requirements_completed",
  "wetsuit_requested",
  "prescription_mask_requested",
  "action_type",
  "missing_field_categories",
  "error_count",
  "elapsed_seconds_bucket",
  "participant_count_bucket",
  "headcount",
  "adultCount",
  "childCount",
  "under3Count",
  "total",
  "currency",
  "line_logged_in",
  "source",
  "outcome",
  "errorCategory",
  "linkHost",
  "linkType",
  "vitalName",
  "vitalValue",
  "vitalRating",
  "engagedSeconds",
  "maxScrollPercent",
] as const
