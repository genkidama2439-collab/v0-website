// 予約者情報と予約前の閲覧履歴を結合するための識別子管理。
//
// - visitor_id: 同じブラウザを長期間識別（395日）
// - visit_id: タブ単位の訪問を識別（30分無操作で更新）
// - booking_funnel_id: LINE認証の往復を含む予約フォーム1回分
//
// これらは行動履歴と予約情報を結合できるため、匿名情報ではない。
// 利用者が明示的に同意した場合だけ生成・送信する。

export const TRACKING_CONSENT_VERSION = "2026-08-13"
export const TRACKING_CONSENT_EVENT = "customer-tracking-consent-changed"
export const TRACKING_PREFERENCES_EVENT = "customer-tracking-preferences-open"

export type TrackingConsentStatus = "accepted" | "declined" | "unknown"

interface TrackingConsentRecord {
  status: Exclude<TrackingConsentStatus, "unknown">
  version: string
  decidedAt: string
}

interface StoredVisitorIdentity {
  id: string
  createdAt: string
  expiresAt: number
}

interface StoredVisitIdentity {
  id: string
  startedAt: string
  lastSeenAt: number
}

export interface CustomerTrackingIdentity {
  visitorId: string
  visitorCreatedAt: string
  visitId: string
  visitStartedAt: string
  bookingFunnelId: string
  consentVersion: string
  consentedAt: string
}

export interface BookingCustomerAnalytics extends CustomerTrackingIdentity {
  currentPage: string
  deviceType: string
  browser: string
  os: string
}

const CONSENT_KEY = "customer_tracking_consent_v1"
const VISITOR_KEY = "customer_visitor_identity_v1"
const VISIT_KEY = "customer_visit_identity_v1"
const BOOKING_FUNNEL_KEY = "customer_booking_funnel_id_v1"
const VISITOR_MAX_AGE_MS = 395 * 24 * 60 * 60 * 1000
const VISIT_IDLE_MS = 30 * 60 * 1000
const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  // randomUUID 非対応ブラウザ用。識別子であり、認証用の秘密値ではない。
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.random() * 16 >> (Number(char) / 4))).toString(16),
  )
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const value = storage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // プライベートブラウズ等で保存できなくても予約は止めない。
  }
}

export function getTrackingConsentRecord(): TrackingConsentRecord | null {
  if (typeof window === "undefined") return null
  const record = readJson<TrackingConsentRecord>(window.localStorage, CONSENT_KEY)
  if (!record || (record.status !== "accepted" && record.status !== "declined")) return null
  if (record.version !== TRACKING_CONSENT_VERSION || !record.decidedAt) return null
  return record
}

export function getTrackingConsentStatus(): TrackingConsentStatus {
  return getTrackingConsentRecord()?.status ?? "unknown"
}

export function hasTrackingConsent(): boolean {
  return getTrackingConsentStatus() === "accepted"
}

export function setTrackingConsent(status: Exclude<TrackingConsentStatus, "unknown">): void {
  if (typeof window === "undefined") return
  const record: TrackingConsentRecord = {
    status,
    version: TRACKING_CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  }
  writeJson(window.localStorage, CONSENT_KEY, record)
  if (status === "declined") clearCustomerTrackingIdentity()
  window.dispatchEvent(new CustomEvent(TRACKING_CONSENT_EVENT, { detail: { status } }))
}

export function clearCustomerTrackingIdentity(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(VISITOR_KEY)
    window.sessionStorage.removeItem(VISIT_KEY)
    window.sessionStorage.removeItem(BOOKING_FUNNEL_KEY)
  } catch {
    // ストレージ制限中は何もしない。
  }
}

function getOrCreateVisitor(): StoredVisitorIdentity | null {
  if (!hasTrackingConsent()) return null
  const now = Date.now()
  const current = readJson<StoredVisitorIdentity>(window.localStorage, VISITOR_KEY)
  if (current && ID_PATTERN.test(current.id) && current.expiresAt > now && current.createdAt) {
    return current
  }

  const createdAt = new Date(now).toISOString()
  const visitor = { id: newId(), createdAt, expiresAt: now + VISITOR_MAX_AGE_MS }
  writeJson(window.localStorage, VISITOR_KEY, visitor)
  return visitor
}

function getOrCreateVisit(): StoredVisitIdentity | null {
  if (!hasTrackingConsent()) return null
  const now = Date.now()
  const current = readJson<StoredVisitIdentity>(window.sessionStorage, VISIT_KEY)
  if (current && ID_PATTERN.test(current.id) && current.startedAt && now - current.lastSeenAt <= VISIT_IDLE_MS) {
    const touched = { ...current, lastSeenAt: now }
    writeJson(window.sessionStorage, VISIT_KEY, touched)
    return touched
  }

  const visit = { id: newId(), startedAt: new Date(now).toISOString(), lastSeenAt: now }
  writeJson(window.sessionStorage, VISIT_KEY, visit)
  return visit
}

export function beginCustomerBookingFunnel(): string {
  if (typeof window === "undefined" || !hasTrackingConsent()) return ""
  try {
    const current = window.sessionStorage.getItem(BOOKING_FUNNEL_KEY)
    if (current && ID_PATTERN.test(current)) return current
    const id = newId()
    window.sessionStorage.setItem(BOOKING_FUNNEL_KEY, id)
    return id
  } catch {
    return ""
  }
}

export function completeCustomerBookingFunnel(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(BOOKING_FUNNEL_KEY)
  } catch {
    // 予約完了処理は止めない。
  }
}

function currentBookingFunnelId(): string {
  try {
    const id = window.sessionStorage.getItem(BOOKING_FUNNEL_KEY) || ""
    return ID_PATTERN.test(id) ? id : ""
  } catch {
    return ""
  }
}

export function getCustomerTrackingIdentity(): CustomerTrackingIdentity | null {
  if (typeof window === "undefined") return null
  const consent = getTrackingConsentRecord()
  if (consent?.status !== "accepted") return null
  const visitor = getOrCreateVisitor()
  const visit = getOrCreateVisit()
  if (!visitor || !visit) return null

  return {
    visitorId: visitor.id,
    visitorCreatedAt: visitor.createdAt,
    visitId: visit.id,
    visitStartedAt: visit.startedAt,
    bookingFunnelId: currentBookingFunnelId(),
    consentVersion: consent.version,
    consentedAt: consent.decidedAt,
  }
}

function browserName(): string {
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return "Edge"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari"
  if (/Firefox\//.test(ua)) return "Firefox"
  return "Other"
}

function osName(): string {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS"
  if (/Android/.test(ua)) return "Android"
  if (/Mac OS X/.test(ua)) return "macOS"
  if (/Windows/.test(ua)) return "Windows"
  if (/Linux/.test(ua)) return "Linux"
  return "Other"
}

function deviceType(): string {
  const width = window.innerWidth
  if (/iPad|Tablet/.test(navigator.userAgent) || (width >= 768 && width < 1024)) return "tablet"
  if (/Mobi|Android|iPhone|iPod/.test(navigator.userAgent) || width < 768) return "mobile"
  return "desktop"
}

export function getBookingCustomerAnalytics(): BookingCustomerAnalytics | null {
  const identity = getCustomerTrackingIdentity()
  if (!identity || typeof window === "undefined") return null
  return {
    ...identity,
    currentPage: window.location.pathname || "/",
    deviceType: deviceType(),
    browser: browserName(),
    os: osName(),
  }
}

export function openTrackingPreferences(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(TRACKING_PREFERENCES_EVENT))
}
