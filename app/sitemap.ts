import type { MetadataRoute } from "next"
import { getBlogPosts } from "@/lib/blog"
import { PLAN_DETAILS } from "@/lib/plan-details"
import { EN_PLAN_BY_ID } from "@/lib/i18n/en"
import { INTL_LOCALES, localePath } from "@/lib/i18n/locales"

const SITE_URL = "https://www.umigamekyoudaimiyakojima.com"

// 静的ページ・プランの最終更新日。new Date() だと毎ビルドで全URLが「今日」になり
// 鮮度シグナルとして信頼されにくいため、内容更新時に手動で更新する固定日を使う。
// 2026-07-02: サンセットSUP実写真差し替え・C5/C6カバー刷新のため更新
const CONTENT_LAST_UPDATED = new Date("2026-07-02")

export default function sitemap(): MetadataRoute.Sitemap {
  const BLOG_POSTS = getBlogPosts()
  // /blog 一覧の更新日は最新記事の日付から導出（記事追加で自動更新）。
  const blogDates = BLOG_POSTS
    .filter((post) => post && typeof post === "object" && post.id)
    .map((post) => new Date(post.date || post.publishedAt).getTime())
  const blogIndexUpdated = blogDates.length
    ? new Date(Math.max(...blogDates))
    : CONTENT_LAST_UPDATED

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "weekly", priority: 1.0 },
    // 非指名「宮古島 ウミガメ」系の受け皿となるピラーページ
    { url: `${SITE_URL}/miyakojima-sea-turtle`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "monthly", priority: 0.9 },
    // プラン一覧ハブ（各 /plans/[id] への内部リンク集約点）
    { url: `${SITE_URL}/plans`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "monthly", priority: 0.8 },
    // /book は noindex のため検索流入対象外。サイトマップには含めない。
    { url: `${SITE_URL}/gallery`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/staff`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    // 予約前の不安解消ページ（安全対策・集合場所）。2026-07-06追加
    { url: `${SITE_URL}/safety`, lastModified: new Date("2026-07-06"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/access`, lastModified: new Date("2026-07-06"), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: blogIndexUpdated, changeFrequency: "weekly", priority: 0.7 },
    // 法的ページ（信頼性シグナル。検索流入は想定しないため低priority）
    { url: `${SITE_URL}/terms`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/tokushoho`, lastModified: CONTENT_LAST_UPDATED, changeFrequency: "yearly", priority: 0.3 },
  ]

  // 多言語版（/en /ko /zh-tw配下）。各 /book はnoindexのため含めない。
  // ko/zh-tw は 2026-07-11 新設。
  const INTL_UPDATED: Record<string, Date> = {
    en: CONTENT_LAST_UPDATED,
    ko: new Date("2026-07-11"),
    "zh-tw": new Date("2026-07-11"),
  }
  const intlStaticPages: MetadataRoute.Sitemap = INTL_LOCALES.flatMap((l) => {
    const updated = INTL_UPDATED[l]
    return [
      { url: `${SITE_URL}${localePath(l, "/")}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.7 },
      { url: `${SITE_URL}${localePath(l, "/plans")}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.6 },
      { url: `${SITE_URL}${localePath(l, "/miyakojima-sea-turtle")}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.6 },
      { url: `${SITE_URL}${localePath(l, "/faq")}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.4 },
      { url: `${SITE_URL}${localePath(l, "/terms")}`, lastModified: updated, changeFrequency: "yearly" as const, priority: 0.2 },
      { url: `${SITE_URL}${localePath(l, "/privacy")}`, lastModified: updated, changeFrequency: "yearly" as const, priority: 0.2 },
    ]
  })

  const planPages: MetadataRoute.Sitemap = Object.keys(PLAN_DETAILS).map((id) => ({
    url: `${SITE_URL}/plans/${id}`,
    lastModified: CONTENT_LAST_UPDATED,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  // 多言語版プラン詳細。外国語サイトに掲載しているIDのみ（EN_PLAN_BY_ID にあるもの）。
  // 外国語サイトは貸切プランのみ扱うため、通常プランとセットプランはここに載らない
  //（掲載範囲は lib/i18n/locales.ts の INTL_PLAN_IDS）。
  const intlPlanPages: MetadataRoute.Sitemap = INTL_LOCALES.flatMap((l) =>
    Object.keys(PLAN_DETAILS)
      .filter((id) => EN_PLAN_BY_ID[id])
      .map((id) => ({
        url: `${SITE_URL}${localePath(l, `/plans/${id}`)}`,
        lastModified: INTL_UPDATED[l],
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }))
  )

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS
    .filter((post) => post && typeof post === "object" && post.id)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.id}`,
      lastModified: new Date(post.date || post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))

  return [...staticPages, ...intlStaticPages, ...planPages, ...intlPlanPages, ...blogPages]
}
