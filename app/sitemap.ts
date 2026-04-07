import type { MetadataRoute } from "next"
import { BLOG_POSTS } from "@/lib/data"
import { PLAN_DETAILS } from "@/lib/plan-details"

const SITE_URL = "https://www.umigamekyoudaimiyakojima.com"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/book`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/gallery`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/staff`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ]

  const planPages: MetadataRoute.Sitemap = Object.keys(PLAN_DETAILS).map((id) => ({
    url: `${SITE_URL}/plans/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS
    .filter((post) => post && typeof post === "object" && post.id)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }))

  return [...staticPages, ...planPages, ...blogPages]
}
