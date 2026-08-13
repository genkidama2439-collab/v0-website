"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"
import { Analytics } from "@vercel/analytics/next"

import { AttributionTracker } from "@/components/attribution-tracker"
import { DetailedAnalytics } from "@/components/detailed-analytics"
import {
  TRACKING_CONSENT_EVENT,
  getTrackingConsentStatus,
  hasTrackingConsent,
} from "@/lib/customer-tracking"

export function ConsentAwareAnalytics({ gaId }: { gaId?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const applyConsent = () => {
      const accepted = getTrackingConsentStatus() === "accepted"
      setEnabled(accepted)

      // 一度GAのスクリプトを読み込んだあと同意を撤回した場合も、以後の送信を止める。
      if (gaId) {
        const analyticsWindow = window as typeof window & {
          dataLayer?: unknown[][]
          gtag?: (...args: unknown[]) => void
          [key: `ga-disable-${string}`]: boolean | undefined
        }
        analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
        analyticsWindow.gtag = analyticsWindow.gtag || ((...args: unknown[]) => {
          analyticsWindow.dataLayer?.push(args)
        })
        analyticsWindow[`ga-disable-${gaId}`] = !accepted
        analyticsWindow.gtag("consent", "default", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        })
        analyticsWindow.gtag?.("consent", "update", {
          analytics_storage: accepted ? "granted" : "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        })
      }
    }

    applyConsent()
    const onChange = () => applyConsent()
    window.addEventListener(TRACKING_CONSENT_EVENT, onChange)
    return () => window.removeEventListener(TRACKING_CONSENT_EVENT, onChange)
  }, [gaId])

  if (!enabled) return null

  return (
    <>
      <AttributionTracker />
      <DetailedAnalytics />
      <Analytics beforeSend={(event) => hasTrackingConsent() ? event : null} />
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  )
}
