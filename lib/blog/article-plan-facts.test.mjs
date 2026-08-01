// 記事本文がプランページへリンクしながら、料金や定員を誤って書いていないか検査する。
//
// 実際に「貸切ウミガメシュノーケル（9,000円/名・最大6名）」（正しくは最大10名）や
// 「VIP貸切 料金：6,500円〜」（正しくは9,000円）という記載が本番に出ていたため、
// 記事とマスタデータのズレをテストで止める。

import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"
import path from "node:path"

import { PLAN_PRICE_DATA } from "../plan-price-display.ts"
import { getPlanMaxParticipants } from "../booking-rules.ts"

const BLOG_DIR = path.join(process.cwd(), "content/blog")

// [ラベル（…円…）](/plans/ID) 形式のリンクを拾う
const PRICED_PLAN_LINK = /\[([^\]]*?[0-9][\d,]*円[^\]]*?)\]\(\/plans\/([A-Za-z0-9-]+)\)/g
const YEN = /([0-9][\d,]*)円/g
const HEADCOUNT = /最大\s*([0-9]+)\s*名/

function readPosts() {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({ file, text: fs.readFileSync(path.join(BLOG_DIR, file), "utf8") }))
}

test("prices written inside a plan link match the plan price master", () => {
  for (const { file, text } of readPosts()) {
    for (const [, label, planId] of text.matchAll(PRICED_PLAN_LINK)) {
      const plan = PLAN_PRICE_DATA[planId]
      assert.ok(plan, `${file}: 未知のプランID ${planId}`)

      const allowed = new Set([plan.price, plan.childPrice ?? plan.price])

      for (const [, raw] of label.matchAll(YEN)) {
        const amount = Number(raw.replace(/,/g, ""))
        assert.ok(
          allowed.has(amount),
          `${file}: ${planId} の料金表記 ${amount}円 がマスタ（${[...allowed].join(" / ")}円）と一致しない\n  → ${label}`,
        )
      }
    }
  }
})

test("participant limits written inside a plan link match the booking rules", () => {
  for (const { file, text } of readPosts()) {
    for (const [, label, planId] of text.matchAll(PRICED_PLAN_LINK)) {
      const stated = label.match(HEADCOUNT)
      if (!stated) continue

      const max = getPlanMaxParticipants(planId)
      if (max === undefined) continue

      assert.equal(
        Number(stated[1]),
        max,
        `${file}: ${planId} の定員表記が予約ルール（${max}名）と一致しない\n  → ${label}`,
      )
    }
  }
})
