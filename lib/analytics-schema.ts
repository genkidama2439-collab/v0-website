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
] as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number]

export type AnalyticsValue = string | number | boolean | null

export type AnalyticsEventProperties = Record<string, AnalyticsValue>

export interface DetailedAnalyticsEvent {
  event_name: AnalyticsEventName
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
