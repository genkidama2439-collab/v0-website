"use client"

import type {
  AnalyticsEventName,
  AnalyticsEventProperties,
  DetailedAnalyticsEvent,
} from "@/lib/analytics-schema"
import { trackEvent } from "@/lib/analytics"
import { getAttribution } from "@/lib/attribution"
import { getCustomerTrackingIdentity, hasTrackingConsent } from "@/lib/customer-tracking"

function getBrowser(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return "Edge"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari"
  if (/Firefox\//.test(ua)) return "Firefox"
  return "Other"
}

function getOS(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS"
  if (/Android/.test(ua)) return "Android"
  if (/Mac OS X/.test(ua)) return "macOS"
  if (/Windows/.test(ua)) return "Windows"
  if (/Linux/.test(ua)) return "Linux"
  return "Other"
}

function getDeviceType(): string {
  const width = window.innerWidth
  if (/iPad|Tablet/.test(navigator.userAgent) || (width >= 768 && width < 1024)) return "tablet"
  if (/Mobi|Android|iPhone|iPod/.test(navigator.userAgent) || width < 768) return "mobile"
  return "desktop"
}

function getConnectionType(): string {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string }
  }
  return nav.connection?.effectiveType || "unknown"
}

function getLocaleFromPath(pathname: string): string {
  const first = pathname.split("/").filter(Boolean)[0]
  if (first === "en" || first === "ko" || first === "zh-tw") return first
  return "ja"
}

// サイト内CTAのように、訪問者の流入元ではなく「クリックされたリンク自身」のUTMを
// 記録したいイベント向けの上書き。渡さなければ従来どおり流入元（getAttribution）を使う。
export interface DetailedEventUtmOverride {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export function buildDetailedEvent(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
  utmOverride?: DetailedEventUtmOverride,
): DetailedAnalyticsEvent | null {
  if (typeof window === "undefined") return null
  if (!hasTrackingConsent()) return null

  const attribution = getAttribution()
  const identity = getCustomerTrackingIdentity()
  if (!identity) return null
  const pathname = window.location.pathname || "/"

  return {
    event_name: name,
    visitor_id: identity.visitorId,
    visit_id: identity.visitId,
    booking_funnel_id: identity.bookingFunnelId,
    consent_version: identity.consentVersion,
    consented_at: identity.consentedAt,
    page_path: pathname,
    locale: getLocaleFromPath(pathname),
    device_type: getDeviceType(),
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    // 流入元（referrer_host / landing_page）はUTMを上書きしても残すので、
    // 「どこから来た人が、どのCTAを押したか」は引き続き追える。
    referrer_host: attribution?.referrer || "",
    landing_page: attribution?.landingPage || pathname,
    utm_source: utmOverride?.utm_source ?? attribution?.source ?? "",
    utm_medium: utmOverride?.utm_medium ?? attribution?.medium ?? "",
    utm_campaign: utmOverride?.utm_campaign ?? attribution?.campaign ?? "",
    utm_content: utmOverride?.utm_content ?? "",
    utm_term: utmOverride?.utm_term ?? "",
    browser: getBrowser(),
    os: getOS(),
    screen_width: window.screen?.width || 0,
    screen_height: window.screen?.height || 0,
    connection_type: getConnectionType(),
    properties,
  }
}

// GA4 / Vercel Analytics へ送る。転送方式（fetch / sendBeacon）に関係なく共通。
function forwardToAnalyticsClients(event: DetailedAnalyticsEvent): void {
  trackEvent(event.event_name, {
    ...event.properties,
    page_path: event.page_path,
    locale: event.locale,
    device_type: event.device_type,
    viewport_width: event.viewport_width,
    viewport_height: event.viewport_height,
    referrer_host: event.referrer_host,
    landing_page: event.landing_page,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    utm_content: event.utm_content,
    utm_term: event.utm_term,
    browser: event.browser,
    os: event.os,
    screen_width: event.screen_width,
    screen_height: event.screen_height,
    connection_type: event.connection_type,
  })
}

// スプレッドシートへ送る。計測は予約操作を妨げてはいけないため、失敗しても投げない。
function deliverToSheet(event: DetailedAnalyticsEvent, preferBeacon: boolean): void {
  const body = JSON.stringify(event)

  if (preferBeacon) {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([body], { type: "application/json" })
        if (navigator.sendBeacon("/api/analytics/events", blob)) return
      }
    } catch {
      // sendBeacon が使えない・拒否された場合は下の fetch へフォールバックする
    }
  }

  try {
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // 計測の失敗をユーザーの操作へ波及させない
  }
}

export function sendDetailedEvent(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
  utmOverride?: DetailedEventUtmOverride,
): void {
  const event = buildDetailedEvent(name, properties, utmOverride)
  if (!event) return

  forwardToAnalyticsClients(event)
  deliverToSheet(event, false)
}

/**
 * 直後にページを離れるイベント用（pagehide、LINEログインのリダイレクト等）。
 * sendBeacon はページが破棄されても送信が保証されやすく、fetch(keepalive) より確実。
 *
 * line_login_click が0件なのに line_login_redirect_started が記録されるという
 * 取りこぼしが実データで出たため、遷移直前のイベントはこちらを使う。
 */
export function sendDetailedEventBeacon(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
  utmOverride?: DetailedEventUtmOverride,
): void {
  const event = buildDetailedEvent(name, properties, utmOverride)
  if (!event) return

  forwardToAnalyticsClients(event)
  deliverToSheet(event, true)
}
