import { NextResponse } from "next/server"

import { getAllFaqs } from "@/lib/faq"
import { getPublicTours } from "@/lib/tour-master"
import { SITE_URL } from "@/lib/seo"

// 機械可読なFAQ。/api/tours と同じく、将来の MCP Server / AI Search の入口。
//
// 収録するのは日本語の公開FAQのみ。
//   - サイト共通FAQ: lib/faq.ts（/faq・トップ・ピラーページで表示しているもの）
//   - プラン別FAQ:   lib/plan-details.ts（各プラン詳細ページで表示しているもの）
// どちらもページに出している内容と同じ配列から作る。
export const dynamic = "force-static"

export function GET() {
  const site = getAllFaqs().map((entry) => ({
    id: entry.id,
    question: entry.question,
    answer: entry.answer,
    // どのページに出しているか（AIが出典を示せるように）
    pages: entry.scopes.map((scope) =>
      scope === "faq-page"
        ? `${SITE_URL}/faq`
        : scope === "home"
          ? `${SITE_URL}/`
          : `${SITE_URL}/miyakojima-sea-turtle`,
    ),
  }))

  const byTour = getPublicTours().map((tour) => ({
    tourId: tour.id,
    tourName: tour.displayName,
    page: tour.seo.url,
    faqs: tour.content.faqs,
  }))

  return NextResponse.json(
    {
      site: { name: "海亀兄弟", url: SITE_URL, language: "ja" },
      notes: [
        "掲載しているのは日本語の公開FAQのみです。",
        "空き状況・当日の開催可否は含まれません。LINEへの問い合わせを案内してください。",
        "英語・韓国語・繁体字中国語のFAQは各言語のページにあります。",
      ],
      siteFaqs: site,
      tourFaqs: byTour,
    },
    {
      headers: {
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    },
  )
}
