import { NextResponse } from "next/server"
import {
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_PROPERTY_KEYS,
  type AnalyticsEventName,
  type AnalyticsEventProperties,
} from "@/lib/analytics-schema"

export const runtime = "nodejs"

const MAX_BODY_BYTES = 16_384
const eventNames = new Set<string>(ANALYTICS_EVENT_NAMES)
const propertyKeys = new Set<string>(ANALYTICS_PROPERTY_KEYS)
const CURRENT_TRACKING_CONSENT_VERSION = "2026-08-13"
const TRACKING_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function text(value: unknown, max = 200): string {
  return typeof value === "string" ? value.slice(0, max) : ""
}

function number(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  return Math.min(max, Math.max(min, value))
}

function safePath(value: unknown): string {
  const path = text(value, 300)
  return path.startsWith("/") && !path.includes("?") ? path : "/"
}

function trackingId(value: unknown): string {
  const id = text(value, 36)
  return TRACKING_ID_PATTERN.test(id) ? id : ""
}

function isoDate(value: unknown): string {
  const raw = text(value, 40)
  const parsed = new Date(raw)
  return raw && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : ""
}

function safeProperties(value: unknown): AnalyticsEventProperties {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  const source = value as Record<string, unknown>
  const result: AnalyticsEventProperties = {}

  for (const [key, raw] of Object.entries(source)) {
    if (!propertyKeys.has(key)) continue
    if (typeof raw === "string") result[key] = raw.slice(0, 200)
    else if (typeof raw === "number" && Number.isFinite(raw)) result[key] = raw
    else if (typeof raw === "boolean" || raw === null) result[key] = raw
  }
  return result
}

export async function POST(request: Request) {
  const body = await request.text()
  if (body.length > MAX_BODY_BYTES) {
    return NextResponse.json({ accepted: false }, { status: 413 })
  }

  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(body) as Record<string, unknown>
  } catch {
    return NextResponse.json({ accepted: false }, { status: 400 })
  }

  const eventName = text(raw.event_name, 64)
  if (!eventNames.has(eventName)) {
    return NextResponse.json({ accepted: false }, { status: 400 })
  }

  const event = {
    occurred_at: new Date().toISOString(),
    event_name: eventName as AnalyticsEventName,
    visitor_id: trackingId(raw.visitor_id),
    visit_id: trackingId(raw.visit_id),
    booking_funnel_id: trackingId(raw.booking_funnel_id),
    consent_version: text(raw.consent_version, 30),
    consented_at: isoDate(raw.consented_at),
    page_path: safePath(raw.page_path),
    locale: text(raw.locale, 10),
    device_type: text(raw.device_type, 20),
    viewport_width: number(raw.viewport_width, 0, 10_000),
    viewport_height: number(raw.viewport_height, 0, 10_000),
    referrer_host: text(raw.referrer_host, 200),
    landing_page: safePath(raw.landing_page),
    utm_source: text(raw.utm_source, 120),
    utm_medium: text(raw.utm_medium, 120),
    utm_campaign: text(raw.utm_campaign, 160),
    utm_content: text(raw.utm_content, 160),
    utm_term: text(raw.utm_term, 160),
    browser: text(raw.browser, 30),
    os: text(raw.os, 30),
    screen_width: number(raw.screen_width, 0, 10_000),
    screen_height: number(raw.screen_height, 0, 10_000),
    connection_type: text(raw.connection_type, 30),
    properties: safeProperties(raw.properties),
  }

  if (
    !event.visitor_id ||
    !event.visit_id ||
    event.consent_version !== CURRENT_TRACKING_CONSENT_VERSION ||
    !event.consented_at
  ) {
    return NextResponse.json({ accepted: false, reason: "tracking_consent_required" }, { status: 400 })
  }

  const webhookUrl = process.env.ANALYTICS_SHEETS_WEBHOOK_URL
  const secret = process.env.ANALYTICS_SHEETS_SHARED_SECRET
  if (!webhookUrl || !secret) {
    return NextResponse.json({ accepted: false, reason: "not_configured" }, { status: 202 })
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, event }),
      cache: "no-store",
    })
    if (!response.ok) throw new Error("analytics_webhook_failed")
    return NextResponse.json({ accepted: true })
  } catch {
    return NextResponse.json({ accepted: false, reason: "delivery_failed" }, { status: 502 })
  }
}
