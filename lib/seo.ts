import type { Metadata } from "next"

export const SITE_URL = "https://www.umigamekyoudaimiyakojima.com"
export const SITE_NAME = "海亀兄弟"
export const SITE_DESCRIPTION = "宮古島で家族向け少人数制マリン体験なら海亀兄弟。ウミガメシュノーケル、貸切ツアー、ナイトツアー、サンセットSUPなど。安全管理徹底、写真・動画無料、前日キャンセル無料。"

export const OG_IMAGE = `${SITE_URL}/images/s1-sea-turtle-snorkeling.jpg`

export function createMetadata({
  title,
  description,
  path = "",
  image,
  type = "website",
}: {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "article"
}): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image || OG_IMAGE

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ja_JP",
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  }
}
