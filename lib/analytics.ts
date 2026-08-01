import { track } from "@vercel/analytics"

import type { AnalyticsEventName, AnalyticsEventProperties } from "./analytics-schema"

export type TrackEventName = AnalyticsEventName
export type TrackEventProps = AnalyticsEventProperties

type GAEventParams = Record<string, string | number | boolean | null>

export interface GAEvent {
  name: string
  params: GAEventParams
}

const ALLOWED_PROPERTY_KEYS = new Set([
  "locale",
  "location",
  "plan",
  "planName",
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
  "page_path",
  "device_type",
  "referrer_host",
  "landing_page",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "browser",
  "os",
  "connection_type",
  "viewport_width",
  "viewport_height",
  "screen_width",
  "screen_height",
])

const GA_EVENT_NAME: Partial<Record<TrackEventName, string>> = {
  book_cta_click: "reservation_click",
  line_click: "line_click",
  line_add_friend_click: "line_add_friend_click",
  phone_click: "phone_click",
  booking_form_view: "booking_form_view",
  line_login_click: "line_login_click",
  booking_submitted: "generate_lead",
}

const GA_PARAM_KEY: Record<string, string> = {
  location: "location",
  plan: "plan_id",
  planName: "plan_name",
  ctaType: "cta_type",
  ctaLabel: "cta_label",
  locale: "locale",
  line_logged_in: "line_logged_in",
  source: "lead_source",
  headcount: "headcount",
  adultCount: "adult_count",
  childCount: "child_count",
  under3Count: "under_3_count",
  outcome: "outcome",
  errorCategory: "error_category",
}

export function sanitizeAnalyticsProperties(
  props?: TrackEventProps,
): TrackEventProps {
  const safeProps: TrackEventProps = {}

  if (!props) return safeProps

  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROPERTY_KEYS.has(key)) continue

    if (typeof value === "string") {
      safeProps[key] = value.slice(0, 256)
      continue
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) safeProps[key] = value
      continue
    }

    if (typeof value === "boolean" || value === null) {
      safeProps[key] = value
    }
  }

  return safeProps
}

export function buildGAEvent(
  name: TrackEventName,
  props?: TrackEventProps,
): GAEvent | null {
  const gaEventName = GA_EVENT_NAME[name]
  if (!gaEventName) return null

  const safeProps = sanitizeAnalyticsProperties(props)
  const params: GAEventParams = {}

  for (const [propertyKey, gaKey] of Object.entries(GA_PARAM_KEY)) {
    const value = safeProps[propertyKey]
    if (value !== undefined) params[gaKey] = value
  }

  if (name === "booking_submitted") {
    params.currency =
      typeof safeProps.currency === "string" ? safeProps.currency : "JPY"

    const value = safeProps.total
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      params.value = value
    }
  }

  return { name: gaEventName, params }
}

export function categorizeBookingFailure(status?: number): string {
  if (status === undefined) return "network"
  if (status === 400 || status === 422) return "validation"
  if (status === 401 || status === 403) return "authentication"
  if (status === 409) return "conflict"
  if (status === 429) return "rate_limited"
  if (status >= 500) return "server"
  return "unexpected_response"
}

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: string,
      params?: GAEventParams,
    ) => void
  }
}

export function trackEvent(name: TrackEventName, props?: TrackEventProps): void {
  const safeProps = sanitizeAnalyticsProperties(props)

  try {
    track(name, safeProps)
  } catch {
    // Analytics must never interrupt the booking flow.
  }

  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return

    const gaEvent = buildGAEvent(name, safeProps)
    if (!gaEvent) return

    window.gtag("event", gaEvent.name, gaEvent.params)
  } catch {
    // Analytics must never interrupt the booking flow.
  }
}
