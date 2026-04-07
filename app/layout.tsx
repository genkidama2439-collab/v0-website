import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Noto_Serif_JP } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import Script from "next/script"
import { WelcomeAnimation } from "@/components/welcome-animation"
import { LiffProvider } from "@/components/liff-provider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })
const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-noto-serif-jp",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.umigamekyoudaimiyakojima.com"),
  title: {
    default: "海亀兄弟 | 宮古島ウミガメシュノーケル・マリン体験",
    template: "%s | 海亀兄弟 - 宮古島",
  },
  description:
    "宮古島で家族向け少人数制マリン体験なら海亀兄弟。ウミガメシュノーケル（遭遇率100%継続中）、VIP貸切ツアー、ナイトツアー、サンセットSUP。写真・動画無料、前日キャンセル無料。",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "海亀兄弟 | 宮古島ウミガメシュノーケル・マリン体験",
    description: "宮古島で家族向け少人数制マリン体験。ウミガメ遭遇率100%継続中。写真・動画無料、前日キャンセル無料。",
    url: "https://www.umigamekyoudaimiyakojima.com",
    siteName: "海亀兄弟",
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: "/images/s1-sea-turtle-snorkeling.jpg",
        width: 1200,
        height: 630,
        alt: "宮古島の海亀兄弟 - ウミガメシュノーケルツアー",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "海亀兄弟 | 宮古島ウミガメシュノーケル・マリン体験",
    description: "宮古島で家族向け少人数制マリン体験。ウミガメ遭遇率100%継続中。写真・動画無料。",
    images: ["/images/s1-sea-turtle-snorkeling.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${jetbrainsMono.variable} ${notoSerifJP.variable}`} suppressHydrationWarning>
      <head>
        <link key="preconnect-blob" rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link key="dns-prefetch-blob" rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />

        <link
          key="preload-gemini"
          rel="preload"
          as="image"
          href="/images/gemini-generated-image-rq969urq969urq96.jpeg"
          type="image/jpeg"
          fetchPriority="high"
        />

        <link key="preload-hero" rel="preload" as="image" href="/images/hero-aerial-ocean.jpg" type="image/jpeg" fetchPriority="high" />

        <link key="preload-snorkeling" rel="preload" as="image" href="/images/s1-sea-turtle-snorkeling.jpg" type="image/jpeg" />
        <link key="preload-closeup" rel="preload" as="image" href="/images/s2-sea-turtle-closeup.jpg" type="image/jpeg" />
        <link key="preload-crab" rel="preload" as="image" href="/images/night-hunter-crab.jpg" type="image/jpeg" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <WelcomeAnimation />
        <Suspense fallback={null}>
          <LiffProvider>
            {children}
            <Analytics />
            <Toaster position="top-center" richColors />
          </LiffProvider>
        </Suspense>
      </body>
    </html>
  )
}
