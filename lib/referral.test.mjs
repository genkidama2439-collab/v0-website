import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

import { NextRequest } from "next/server"

import { GET as referralRedirect } from "../app/r/[code]/route.ts"
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_MAX_AGE_MS,
  createSignedReferralCookie,
  getVerifiedReferralFromCookieHeader,
  verifySignedReferralCookie,
} from "./referral.ts"

const secret = "referral-test-secret-that-is-at-least-32-characters-long"
const bookingRouteSource = fs.readFileSync(
  new URL("../app/api/booking/route.ts", import.meta.url),
  "utf8",
)

function cookieFromResponse(response) {
  const setCookie = response.headers.get("set-cookie") || ""
  const match = setCookie.match(new RegExp(`${REFERRAL_COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : ""
}

function referralRequest(code, campaign = "", cookie = "") {
  const suffix = campaign ? `?c=${encodeURIComponent(campaign)}` : ""
  return new NextRequest(`https://www.umigamekyoudaimiyakojima.com/r/${code}${suffix}`, {
    headers: cookie ? { cookie: `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(cookie)}` } : {},
  })
}

test("kaita referral link creates a signed 30-day HttpOnly cookie and analytics UTM", () => {
  process.env.REFERRAL_COOKIE_SECRET = secret

  const response = referralRedirect(
    referralRequest("kaita", "instagram"),
    { params: { code: "kaita" } },
  )
  const cookie = cookieFromResponse(response)
  const payload = verifySignedReferralCookie(cookie, secret)
  const location = new URL(response.headers.get("location"))
  const setCookie = response.headers.get("set-cookie") || ""

  assert.equal(response.status, 307)
  assert.equal(payload?.referralCode, "kaita")
  assert.equal(payload?.campaign, "instagram")
  assert.match(setCookie, /HttpOnly/i)
  assert.match(setCookie, /SameSite=Lax/i)
  assert.match(setCookie, /Path=\//i)
  assert.match(setCookie, /Max-Age=2592000/i)
  assert.equal(location.searchParams.get("utm_source"), "affiliate")
  assert.equal(location.searchParams.get("utm_medium"), "referral")
  assert.equal(location.searchParams.get("utm_campaign"), "kaita")
  assert.equal(location.searchParams.get("utm_content"), "instagram")
})

test("an invalid referral-code format redirects home without creating a cookie", () => {
  process.env.REFERRAL_COOKIE_SECRET = secret
  const response = referralRedirect(
    referralRequest("bad code"),
    { params: { code: "bad code" } },
  )
  const location = new URL(response.headers.get("location"))

  assert.equal(response.headers.get("set-cookie"), null)
  assert.equal(location.pathname, "/")
  assert.equal(location.search, "")
})

test("same referral is not renewed and a later referral cannot replace the first", () => {
  process.env.REFERRAL_COOKIE_SECRET = secret
  const first = referralRedirect(
    referralRequest("kaita"),
    { params: { code: "kaita" } },
  )
  const firstCookie = cookieFromResponse(first)

  const same = referralRedirect(
    referralRequest("kaita", "tiktok01", firstCookie),
    { params: { code: "kaita" } },
  )
  const later = referralRedirect(
    referralRequest("ryoya", "flyer", firstCookie),
    { params: { code: "ryoya" } },
  )

  assert.equal(same.headers.get("set-cookie"), null)
  assert.equal(later.headers.get("set-cookie"), null)
  assert.equal(verifySignedReferralCookie(firstCookie, secret)?.referralCode, "kaita")
})

test("an expired first referral allows a new referral to be acquired", () => {
  process.env.REFERRAL_COOKIE_SECRET = secret
  const expiredCookie = createSignedReferralCookie(
    {
      referralCode: "kaita",
      campaign: "instagram",
      acquiredAt: new Date(Date.now() - REFERRAL_MAX_AGE_MS - 60_000).toISOString(),
    },
    secret,
  )
  const response = referralRedirect(
    referralRequest("ryoya", "hotel", expiredCookie),
    { params: { code: "ryoya" } },
  )
  const replacement = verifySignedReferralCookie(cookieFromResponse(response), secret)

  assert.equal(replacement?.referralCode, "ryoya")
  assert.equal(replacement?.campaign, "hotel")
})

test("tampering, a missing cookie, or a missing secret safely resolves to no referral", () => {
  const valid = createSignedReferralCookie(
    {
      referralCode: "kaita",
      campaign: "",
      acquiredAt: new Date().toISOString(),
    },
    secret,
  )
  const tampered = `${valid.slice(0, -1)}${valid.endsWith("A") ? "B" : "A"}`

  assert.equal(
    getVerifiedReferralFromCookieHeader(
      `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(tampered)}`,
      secret,
    ),
    null,
  )
  assert.equal(getVerifiedReferralFromCookieHeader(null, secret), null)
  assert.equal(getVerifiedReferralFromCookieHeader(`${REFERRAL_COOKIE_NAME}=${valid}`, null), null)

  // The booking route reads only the signed server cookie and still builds a normal GAS payload.
  assert.match(bookingRouteSource, /request\.headers\.get\('cookie'\)/)
  assert.match(bookingRouteSource, /getVerifiedReferralFromCookieHeader/)
  assert.match(bookingRouteSource, /let referral: ReferralCookiePayload \| null = null/)
  assert.match(bookingRouteSource, /referral,\s*\n\s*\)/)
  assert.doesNotMatch(bookingRouteSource, /bookingData\.referral/)
})

test("production referral cookies are configured as Secure without exposing the secret publicly", () => {
  const routeSource = fs.readFileSync(
    new URL("../app/r/[code]/route.ts", import.meta.url),
    "utf8",
  )

  assert.match(routeSource, /secure:\s*process\.env\.NODE_ENV === "production"/)
  assert.match(routeSource, /httpOnly:\s*true/)
  assert.doesNotMatch(routeSource, /NEXT_PUBLIC_REFERRAL/)
})
