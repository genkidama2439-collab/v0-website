import { buildLlmsTxt } from "@/lib/ai-feed"

// https://llmstxt.org/ の慣習に沿った、AI向けのサイト案内。
// 中身は lib/tour-master.ts（= 料金・プラン情報の単一ソース）から生成するため、
// サイト表示とAIの回答が食い違わない。
export const dynamic = "force-static"

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
