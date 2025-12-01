import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "海亀兄弟予約ページ | 宮古島マリン体験",
  description:
    "宮古島で家族向け少人数制マリン体験なら海亀兄弟。ウミガメシュノーケル、ナイトツアーなど、安心・誠実・やわらかな高揚感をお届けします。",
  generator: "v0.app",
  openGraph: {
    title: "海亀兄弟 | 宮古島マリン体験",
    description: "家族向け少人数制マリン体験。安心・誠実・やわらかな高揚感をお届けします。",
    url: "https://miyakojima.vercel.app",
    siteName: "海亀兄弟",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "海亀兄弟 | 宮古島マリン体験",
    description: "家族向け少人数制マリン体験。安心・誠実・やわらかな高揚感をお届けします。",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        {/* </CHANGE> */}

        <link rel="preload" as="image" href="/images/hero-aerial-ocean.jpg" type="image/jpeg" fetchPriority="high" />
        {/* </CHANGE> */}

        <link rel="preload" as="image" href="/images/s1-sea-turtle-snorkeling.jpg" type="image/jpeg" />
        <link rel="preload" as="image" href="/images/s2-sea-turtle-closeup.jpg" type="image/jpeg" />
        <link rel="preload" as="image" href="/images/night-hunter-crab.jpg" type="image/jpeg" />
        {/* </CHANGE> */}
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          {children}
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
