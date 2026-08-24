import { type NextRequest, NextResponse } from "next/server"

import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_MAX_AGE_SECONDS,
  buildReferralRedirectUrl,
  createSignedReferralCookie,
  getReferralCookieSecret,
  normalizeReferralCampaign,
  normalizeReferralCode,
  verifySignedReferralCookie,
} from "@/lib/referral"

interface ReferralRouteContext {
  params: { code: string }
}

export function GET(request: NextRequest, context: ReferralRouteContext) {
  const referralCode = normalizeReferralCode(context.params.code)
  const campaign = normalizeReferralCampaign(request.nextUrl.searchParams.get("c"))

  if (!referralCode) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const response = NextResponse.redirect(
    buildReferralRedirectUrl(request.url, referralCode, campaign),
  )
  const secret = getReferralCookieSecret()

  if (!secret) {
    console.error(
      "[referral] REFERRAL_COOKIE_SECRET is missing or shorter than 32 characters",
    )
    return response
  }

  const existing = verifySignedReferralCookie(
    request.cookies.get(REFERRAL_COOKIE_NAME)?.value,
    secret,
  )

  // First Referral Wins: a valid, unexpired first referral is never replaced or renewed.
  if (existing) return response

  const cookieValue = createSignedReferralCookie(
    {
      referralCode,
      campaign,
      acquiredAt: new Date().toISOString(),
    },
    secret,
  )

  response.cookies.set({
    name: REFERRAL_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFERRAL_MAX_AGE_SECONDS,
  })

  return response
}
