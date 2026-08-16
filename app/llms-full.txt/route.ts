import { buildLlmsFullTxt } from "@/lib/ai-feed"

// llms.txt の全文版。各ツアーの持ち物・注意事項・FAQまで含む。
// 将来 Cloudflare AI Search をつなぐときは、このファイルを優先的にクロールさせる。
export const dynamic = "force-static"

export function GET() {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
