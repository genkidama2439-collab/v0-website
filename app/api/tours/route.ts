import { NextResponse } from "next/server"

import { buildTourFeedResponse } from "@/lib/ai-feed"

// 機械可読なツアー情報。将来の MCP Server / AI Search / 外部連携の入口。
//
// 公開情報のみ。lib/tour-master.ts の getPublicTours() を経由するため、
// 予約システム内部の値（GAS内部プラン名・シートID・LINE User ID等）は含まれない。
// 混入していないことは lib/ai-feed.test.mjs が検査する。
//
// 予約の作成はこのAPIでは行わない。予約はLINE認証が必要なため、
// AIには bookingUrl（/book?plan=ID）へ誘導させる。
export const dynamic = "force-static"

export function GET() {
  return NextResponse.json(buildTourFeedResponse(), {
    headers: {
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      // AIエージェント・外部サイトからの読み取りを許可する（公開情報のみのため）
      "access-control-allow-origin": "*",
    },
  })
}
