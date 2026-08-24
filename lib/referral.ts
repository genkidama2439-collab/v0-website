import { createHmac, timingSafeEqual } from "node:crypto"

export const REFERRAL_COOKIE_NAME = "uk_ref_v1"
export const REFERRAL_MAX_AGE_DAYS = 30
export const REFERRAL_MAX_AGE_SECONDS = REFERRAL_MAX_AGE_DAYS * 24 * 60 * 60
export const REFERRAL_MAX_AGE_MS = REFERRAL_MAX_AGE_SECONDS * 1000

const REFERRAL_CODE_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/
const CAMPAIGN_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/
const MIN_SECRET_LENGTH = 32
const CLOCK_SKEW_MS = 5 * 60 * 1000

export interface ReferralCookiePayload {
  referralCode: string
  campaign: string
  acquiredAt: string
}

export const normalizeReferralCode = (value: unknown): string => {
  if (typeof value !== "string") return ""
  const normalized = value.trim().toLowerCase()
  return REFERRAL_CODE_PATTERN.test(normalized) ? normalized : ""
}

export const normalizeReferralCampaign = (value: unknown): string => {
  if (typeof value !== "string") return ""
  const normalized = value.trim()
  return !normalized || CAMPAIGN_PATTERN.test(normalized) ? normalized : ""
}

export const getReferralCookieSecret = (): string | null => {
  const secret = process.env.REFERRAL_COOKIE_SECRET?.trim() || ""
  return secret.length >= MIN_SECRET_LENGTH ? secret : null
}

const sign = (encodedPayload: string, secret: string): string =>
  createHmac("sha256", secret).update(encodedPayload).digest("base64url")

const signaturesMatch = (actual: string, expected: string): boolean => {
  const actualBuffer = Buffer.from(actual, "utf8")
  const expectedBuffer = Buffer.from(expected, "utf8")
  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  )
}

const normalizePayload = (
  value: unknown,
  nowMs: number,
): ReferralCookiePayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const input = value as Partial<ReferralCookiePayload>
  const referralCode = normalizeReferralCode(input.referralCode)
  const campaign = normalizeReferralCampaign(input.campaign)
  const acquiredAt = typeof input.acquiredAt === "string" ? input.acquiredAt : ""
  const acquiredAtMs = Date.parse(acquiredAt)
  const ageMs = nowMs - acquiredAtMs

  if (
    !referralCode ||
    !Number.isFinite(acquiredAtMs) ||
    ageMs < -CLOCK_SKEW_MS ||
    ageMs > REFERRAL_MAX_AGE_MS
  ) {
    return null
  }

  return {
    referralCode,
    campaign,
    acquiredAt: new Date(acquiredAtMs).toISOString(),
  }
}

export const createSignedReferralCookie = (
  payload: ReferralCookiePayload,
  secret: string,
): string => {
  if (secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error("REFERRAL_COOKIE_SECRET must be at least 32 characters")
  }

  const normalized = normalizePayload(payload, Date.parse(payload.acquiredAt))
  if (!normalized) throw new Error("Invalid referral cookie payload")

  const encodedPayload = Buffer.from(JSON.stringify(normalized)).toString("base64url")
  return `${encodedPayload}.${sign(encodedPayload, secret)}`
}

export const verifySignedReferralCookie = (
  cookieValue: string | null | undefined,
  secret: string | null | undefined,
  nowMs = Date.now(),
): ReferralCookiePayload | null => {
  if (!cookieValue || !secret || secret.trim().length < MIN_SECRET_LENGTH) return null

  const parts = cookieValue.split(".")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  if (!signaturesMatch(parts[1], sign(parts[0], secret))) return null

  try {
    const parsed = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"))
    return normalizePayload(parsed, nowMs)
  } catch {
    return null
  }
}

export const getCookieValue = (
  cookieHeader: string | null | undefined,
  cookieName: string,
): string | null => {
  if (!cookieHeader) return null

  for (const pair of cookieHeader.split(";")) {
    const separatorIndex = pair.indexOf("=")
    if (separatorIndex < 0) continue
    const name = pair.slice(0, separatorIndex).trim()
    if (name !== cookieName) continue

    try {
      return decodeURIComponent(pair.slice(separatorIndex + 1).trim())
    } catch {
      return null
    }
  }

  return null
}

export const getVerifiedReferralFromCookieHeader = (
  cookieHeader: string | null | undefined,
  secret: string | null | undefined,
  nowMs = Date.now(),
): ReferralCookiePayload | null =>
  verifySignedReferralCookie(
    getCookieValue(cookieHeader, REFERRAL_COOKIE_NAME),
    secret,
    nowMs,
  )

export const buildReferralRedirectUrl = (
  requestUrl: string,
  referralCode: string,
  campaign: string,
): URL => {
  const redirectUrl = new URL("/", requestUrl)
  redirectUrl.searchParams.set("utm_source", "affiliate")
  redirectUrl.searchParams.set("utm_medium", "referral")
  redirectUrl.searchParams.set("utm_campaign", referralCode)
  if (campaign) redirectUrl.searchParams.set("utm_content", campaign)
  return redirectUrl
}
