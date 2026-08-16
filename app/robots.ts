import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api/tours と /api/faq はAI・外部連携向けの公開データなのでクロールを許可する。
        // robots.txt は一致が長いルールが優先されるため、下の /api/ より先に効く。
        allow: ["/", "/api/tours", "/api/faq"],
        // /book は noindex（page metadata）。クロールは許可して noindex を読ませる。
        // 予約・通知・計測の API ルートはクロール対象外にする。
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.umigamekyoudaimiyakojima.com/sitemap.xml",
  }
}
