import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api/tours はAI・外部連携向けの公開ツアーデータなのでクロールを許可する。
        // robots.txt は一致が長いルールが優先されるため、下の /api/ より先に効く。
        allow: ["/", "/api/tours"],
        // /book は noindex（page metadata）。クロールは許可して noindex を読ませる。
        // 予約・通知・計測の API ルートはクロール対象外にする。
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.umigamekyoudaimiyakojima.com/sitemap.xml",
  }
}
