import type { ReactNode } from "react"
import { Suspense } from "react"
import { Inter } from "next/font/google"
import { ConsentAwareAnalytics } from "@/components/consent-aware-analytics"
import { LiffLoginRelay } from "@/components/liff-login-relay"
import { PrivacyConsent } from "@/components/privacy-consent"
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/json-ld"
import { RouteScrollManager } from "@/components/route-scroll-manager"

/* eslint-disable @next/next/no-head-element -- This component is used exclusively by Next.js root layouts. */

// 実際に使うのは Inter（本文）のみ。Noto Serif JP / JetBrains Mono は
// サイト内で参照されていないため読み込まない。
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export function SiteRootLayout({
  children,
  lang,
}: {
  children: ReactNode
  /** <html lang> に入れる言語タグ（ja / en / ko / zh-Hant） */
  lang: "ja" | "en" | "ko" | "zh-Hant"
}) {
  // GA4 は本番ビルドかつ測定IDがあるときだけ読み込む。
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const enableGa = process.env.NODE_ENV === "production" && !!gaId

  return (
    <html lang={lang} className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          key="preconnect-blob"
          rel="preconnect"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com"
          crossOrigin="anonymous"
        />
        <link
          key="dns-prefetch-blob"
          rel="dns-prefetch"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <WebSiteJsonLd />
        <OrganizationJsonLd />
        <Suspense fallback={null}>
          <RouteScrollManager />
        </Suspense>
        <LiffLoginRelay />
        {children}
        <PrivacyConsent />
        <ConsentAwareAnalytics gaId={enableGa ? gaId : undefined} />
      </body>
    </html>
  )
}
