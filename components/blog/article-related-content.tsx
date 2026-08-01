"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { BLUR_DATA_URLS } from "@/lib/image-placeholders"
import { withCtaUtm, type RelatedContentItem } from "@/lib/blog/article-cta"
import { trackCtaClick } from "@/components/blog/article-cta-card"

const POSITION = "related_content" as const

/** 記事末尾の予約カードの前に置く「この記事を読んだ方におすすめ」。最大3件。 */
export function ArticleRelatedContent({
  items,
  campaign,
}: {
  items: RelatedContentItem[]
  campaign: string
}) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="article-related-heading" className="not-prose my-10">
      <h2 id="article-related-heading" className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">
        この記事を読んだ方におすすめ
      </h2>

      <ul className="grid gap-4 sm:grid-cols-3">
        {items.slice(0, 3).map((item) => {
          const isPlan = item.href.startsWith("/plans/")

          return (
            <li key={item.href}>
              <Link
                href={withCtaUtm(item.href, campaign, POSITION)}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                onClick={() =>
                  trackCtaClick(
                    {
                      label: item.title,
                      href: item.href,
                      type: isPlan ? "plan_detail" : "booking",
                      ...(isPlan ? { planId: item.href.replace("/plans/", "") } : {}),
                    },
                    POSITION,
                    campaign,
                  )
                }
              >
                <div className="relative h-32 w-full overflow-hidden sm:h-28">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                    quality={55}
                    sizes="(max-width: 640px) 100vw, 240px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URLS.ocean}
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-sm font-bold leading-snug text-gray-900 group-hover:text-emerald-700">
                    {item.title}
                  </p>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    詳しく見る
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
