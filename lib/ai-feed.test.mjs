// AI向けフィード（llms.txt / llms-full.txt / /api/tours）の検査。
//
// AIは書いてあることをそのまま答えるため、次の2点を固定する。
//   1. 予約システム内部の値が公開フィードへ漏れないこと
//   2. 料金・対象年齢・開始時刻が、サイト表示や予約APIの判定とズレないこと
//
// 設計と背景は docs/ai-readiness-audit.md を参照。

import assert from "node:assert/strict"
import test from "node:test"

import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildTourFeed,
  buildTourFeedResponse,
  bookingUrl,
  describeAgeRule,
  describeStartTimes,
} from "./ai-feed.ts"
import { TOUR_MASTER, TOUR_MASTER_BY_ID } from "./tour-master.ts"
import { PLAN_PRICE_DATA } from "./plan-price-display.ts"
import { PLAN_DETAILS } from "./plan-details.ts"
import { SENIOR_RESTRICTED_PLAN_IDS, getAdultAgeMax, isParticipantAgeValid } from "./plan-flags.ts"
import { getFaqs } from "./faq.ts"

// 予約システム内部の値。1つでも公開フィードに現れたら事故。
const FORBIDDEN = [
  { pattern: /NOTIFY_SECRET/, label: "LINE通知のシークレット" },
  { pattern: /lineUserId/i, label: "LINE User ID" },
  { pattern: /1bPYur/, label: "スプレッドシートID" },
  { pattern: /genkidama2439/, label: "管理者メール・カレンダーID" },
  { pattern: /script\.google\.com/, label: "GASのURL" },
  { pattern: /docs\.google\.com/, label: "スプレッドシートURL" },
  { pattern: /ANALYTICS_SHARED_SECRET|GAS_BOOKING_URL/, label: "環境変数名" },
  { pattern: /昼夜セット海亀|昼夜セットヤシガニ/, label: "GAS内部のセット分割プラン名" },
  { pattern: /海空セット（ウミガメシュノーケル）|海空セット（ドローンSUP）/, label: "GAS内部のセット分割プラン名" },
  { pattern: /まるごと1日セット海亀|貸切まるごと1日セット/, label: "GAS内部のセット分割プラン名" },
  { pattern: /UMIGAME500|カメハメハ/, label: "クーポンコード" },
]

const FEEDS = [
  ["llms.txt", () => buildLlmsTxt()],
  ["llms-full.txt", () => buildLlmsFullTxt()],
  ["/api/tours", () => JSON.stringify(buildTourFeedResponse())],
]

test("公開フィードに予約システム内部の値が混ざらない", () => {
  for (const [name, build] of FEEDS) {
    const output = build()
    for (const { pattern, label } of FORBIDDEN) {
      assert.ok(!pattern.test(output), `${name}: ${label} が含まれている（${pattern}）`)
    }
  }
})

test("llms.txt に全ツアーが載り、料金がマスタと一致する", () => {
  const output = buildLlmsTxt()

  for (const tour of TOUR_MASTER) {
    assert.ok(output.includes(tour.displayName), `llms.txt に ${tour.id}「${tour.displayName}」がない`)
    assert.ok(output.includes(tour.seo.url), `llms.txt に ${tour.id} のURLがない`)

    const price = `¥${PLAN_PRICE_DATA[tour.id].price.toLocaleString("ja-JP")}`
    assert.ok(output.includes(price), `llms.txt に ${tour.id} の料金 ${price} がない`)
  }
})

test("llms.txt が空き状況を答えないよう明示している", () => {
  const output = buildLlmsTxt()
  assert.ok(output.includes("空き状況"), "空き状況について触れていない")
  assert.ok(/推測せず|掲載していません/.test(output), "推測を止める記述がない")
  assert.ok(output.includes("lin.ee"), "LINEへの誘導がない")
})

test("準備中のツアーは予約URLではなくプランページへ誘導する", () => {
  for (const tour of TOUR_MASTER) {
    const url = bookingUrl(tour)
    if (tour.status === "coming_soon") {
      assert.equal(url, tour.seo.url, `${tour.id}: 準備中なのに予約フォームへ誘導している`)
    } else {
      assert.ok(url.endsWith(`/book?plan=${tour.id}`), `${tour.id}: 予約URLが正しくない（${url}）`)
    }
  }
})

test("対象年齢の説明が、実際に予約できる年齢と一致する", () => {
  for (const tour of TOUR_MASTER) {
    const rule = describeAgeRule(tour)
    const max = getAdultAgeMax(tour.id)

    assert.ok(rule.includes(`${max}歳`), `${tour.id}: 説明に上限 ${max}歳 が入っていない → ${rule}`)
    assert.ok(isParticipantAgeValid(tour.id, "adult", max), `${tour.id}: ${max}歳が実際には予約できない`)
    assert.ok(!isParticipantAgeValid(tour.id, "adult", max + 1), `${tour.id}: ${max + 1}歳が実際には予約できてしまう`)

    // 60歳以上を断るプランは、案内先の貸切版名を必ず書く（行き止まりにしない）
    if (SENIOR_RESTRICTED_PLAN_IDS.has(tour.id)) {
      const alternative = TOUR_MASTER_BY_ID[tour.participants.seniorAlternativeId]
      assert.ok(alternative, `${tour.id}: 案内先プランが解決できない`)
      assert.ok(
        rule.includes(alternative.displayName),
        `${tour.id}: 説明に案内先「${alternative.displayName}」が入っていない → ${rule}`,
      )
    } else {
      assert.ok(!rule.includes("ください"), `${tour.id}: 制限がないのに案内文が入っている → ${rule}`)
    }
  }
})

test("開始時刻の説明が予約APIの受理する値と一致する", () => {
  for (const tour of TOUR_MASTER) {
    const text = describeStartTimes(tour)

    if (!tour.schedule.startTimeFixed) {
      assert.ok(/固定ではありません/.test(text), `${tour.id}: 時刻未確定の説明になっていない`)
      continue
    }

    for (const time of tour.schedule.startTimes) {
      assert.ok(text.includes(time), `${tour.id}: 開始時刻 ${time} が説明に含まれていない`)
    }
    for (const time of tour.schedule.nightStartTimes) {
      assert.ok(text.includes(time), `${tour.id}: 夜の開始時刻 ${time} が説明に含まれていない`)
    }
  }
})

test("llms-full.txt に各ツアーの持ち物・注意事項・FAQと共通FAQが載る", () => {
  const output = buildLlmsFullTxt()

  for (const tour of TOUR_MASTER) {
    assert.ok(output.includes(`## ${tour.displayName}`), `${tour.id} の見出しがない`)
    for (const item of tour.content.whatToBring) {
      assert.ok(output.includes(item), `${tour.id}: 持ち物「${item}」がない`)
    }
    for (const faq of tour.content.faqs) {
      assert.ok(output.includes(faq.question), `${tour.id}: FAQ「${faq.question}」がない`)
    }
  }

  for (const faq of getFaqs("faq-page")) {
    assert.ok(output.includes(faq.question), `共通FAQ「${faq.question}」がない`)
  }
})

test("/api/tours が全ツアーを返し、内容がマスタと一致する", () => {
  const feed = buildTourFeed()

  assert.deepEqual(
    feed.map((item) => item.id).sort(),
    TOUR_MASTER.map((tour) => tour.id).sort(),
    "掲載ツアーが tour-master と一致しない",
  )

  for (const item of feed) {
    const master = TOUR_MASTER_BY_ID[item.id]
    assert.equal(item.name, PLAN_DETAILS[item.id].name, `${item.id}: プラン名`)
    assert.equal(item.pricing.adult, PLAN_PRICE_DATA[item.id].price, `${item.id}: 大人料金`)
    assert.equal(item.meetingTime, PLAN_DETAILS[item.id].meetingTime, `${item.id}: 集合時刻`)
    assert.equal(item.paymentMethod, PLAN_DETAILS[item.id].paymentMethod, `${item.id}: 支払方法`)
    assert.deepEqual(item.faqs, master.content.faqs, `${item.id}: FAQ`)
    assert.ok(item.availableLocales.includes("ja"), `${item.id}: 日本語が含まれていない`)
  }

  const response = buildTourFeedResponse()
  assert.ok(response.notes.some((note) => note.includes("空き状況")), "空き状況の注意書きがない")
  assert.equal(response.site.bookingRequiresLineLogin, true, "LINEログイン必須である旨がない")
})

test("フィードがJSONとして壊れていない", () => {
  const json = JSON.stringify(buildTourFeedResponse())
  const parsed = JSON.parse(json)
  assert.ok(Array.isArray(parsed.tours), "tours が配列でない")
  assert.ok(parsed.tours.length > 0, "tours が空")
})
