import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"
import path from "node:path"

import {
  BOOKING_STAGES,
  beginBookingFunnelSession,
  claimChanged,
  claimOnce,
  claimOncePerBooking,
  daysUntilDate,
  resetFunnelDedupeForTest,
  toBookingFailureStage,
  toBookingTiming,
  toElapsedBucket,
  toGroupSizeBucket,
} from "./booking-funnel.ts"
import { ANALYTICS_EVENT_NAMES, ANALYTICS_PROPERTY_KEYS } from "./analytics-schema.ts"

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  }
}

const funnelLocalStorage = memoryStorage()
funnelLocalStorage.setItem(
  "customer_tracking_consent_v1",
  JSON.stringify({
    status: "accepted",
    version: "2026-08-13",
    decidedAt: "2026-08-13T00:00:00.000Z",
  }),
)
globalThis.window = {
  localStorage: funnelLocalStorage,
  sessionStorage: memoryStorage(),
}

const GAS_PATH = path.join(process.cwd(), "apps-script/umigame-analytics/Code.gs")
const gas = fs.readFileSync(GAS_PATH, "utf8")
const RESERVATION_GAS_PATH = path.join(process.cwd(), "apps-script/umigame-reservation-admin/Code.gs")
const reservationGas = fs.readFileSync(RESERVATION_GAS_PATH, "utf8")

// ============================================================
// 区分化（実値を送らないための変換）
// ============================================================

test("booking timing buckets never expose the actual date", () => {
  assert.equal(toBookingTiming(0), "same_day")
  assert.equal(toBookingTiming(-3), "same_day")
  assert.equal(toBookingTiming(1), "previous_day")
  assert.equal(toBookingTiming(3), "2_to_3_days")
  assert.equal(toBookingTiming(7), "4_to_7_days")
  assert.equal(toBookingTiming(30), "8_to_30_days")
  assert.equal(toBookingTiming(31), "31_days_or_more")
  assert.equal(toBookingTiming(Number.NaN), "unknown")
})

test("daysUntilDate returns a day count, not a date", () => {
  assert.equal(daysUntilDate("2026-08-10", "2026-08-01"), 9)
  assert.equal(daysUntilDate("2026-08-01", "2026-08-01"), 0)
  assert.equal(daysUntilDate("2026-09-01", "2026-08-01"), 31)
  assert.ok(Number.isNaN(daysUntilDate("bogus", "2026-08-01")))
})

test("group size buckets cover every headcount", () => {
  assert.equal(toGroupSizeBucket(1), "1")
  assert.equal(toGroupSizeBucket(2), "2")
  assert.equal(toGroupSizeBucket(4), "3_to_4")
  assert.equal(toGroupSizeBucket(6), "5_to_6")
  assert.equal(toGroupSizeBucket(7), "7_or_more")
  assert.equal(toGroupSizeBucket(0), "unknown")
})

test("elapsed buckets never expose the exact duration", () => {
  assert.equal(toElapsedBucket(5), "under_30s")
  assert.equal(toElapsedBucket(60), "30s_to_2m")
  assert.equal(toElapsedBucket(299), "2m_to_5m")
  assert.equal(toElapsedBucket(599), "5m_to_10m")
  assert.equal(toElapsedBucket(1799), "10m_to_30m")
  assert.equal(toElapsedBucket(3600), "over_30m")
})

test("failure stages distinguish where the booking broke", () => {
  assert.equal(toBookingFailureStage(undefined), "api_request")
  assert.equal(toBookingFailureStage(400), "server_validation")
  assert.equal(toBookingFailureStage(401), "line_session")
  assert.equal(toBookingFailureStage(429), "rate_limit")
  assert.equal(toBookingFailureStage(502), "gas_response")
  assert.equal(toBookingFailureStage(418), "unknown")
})

// ============================================================
// 重複防止
// ============================================================

test("claimOnce fires once even when called repeatedly", () => {
  resetFunnelDedupeForTest()
  assert.equal(claimOnce("x"), true)
  assert.equal(claimOnce("x"), false)
  assert.equal(claimOnce("x"), false)
})

test("claimChanged skips a value that was changed and put back", () => {
  resetFunnelDedupeForTest()
  assert.equal(claimChanged("plan", "S1"), true)
  assert.equal(claimChanged("plan", "S1"), false)
  assert.equal(claimChanged("plan", "S2"), true)
  assert.equal(claimChanged("plan", "S1"), true)
  assert.equal(claimChanged("plan", "S1"), false)
})

// ============================================================
// ステージ
// ============================================================

test("stage names are machine values, never Japanese UI copy", () => {
  for (const stage of BOOKING_STAGES) {
    assert.match(stage, /^[a-z_]+$/, `ステージ名が分析用の値になっていない: ${stage}`)
  }
})

// ============================================================
// フロントとGASのホワイトリスト整合
// ============================================================

test("every funnel event name is accepted by the analytics GAS", () => {
  const block = /const ANALYTICS_EVENTS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(gas)
  assert.ok(block, "GASのANALYTICS_EVENTSが見つからない")
  const gasEvents = new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]))

  for (const name of ANALYTICS_EVENT_NAMES) {
    assert.ok(gasEvents.has(name), `GAS側にイベント名がない（データが捨てられる）: ${name}`)
  }
})

test("every analytics property key is kept by the analytics GAS", () => {
  const block = /function normalizeProperties_\(input\) \{([\s\S]*?)\n\}/.exec(gas)
  assert.ok(block, "GASのnormalizeProperties_が見つからない")
  const gasKeys = new Set([...block[1].matchAll(/^\s{4}([A-Za-z_][A-Za-z0-9_]*):/gm)].map((m) => m[1]))

  for (const key of ANALYTICS_PROPERTY_KEYS) {
    assert.ok(gasKeys.has(key), `GAS側にプロパティがない（値が捨てられる）: ${key}`)
  }
})

test("every property the GAS keeps is also written to a sheet column", () => {
  const normalize = /function normalizeProperties_\(input\) \{([\s\S]*?)\n\}/.exec(gas)[1]
  const gasKeys = [...normalize.matchAll(/^\s{4}([A-Za-z_][A-Za-z0-9_]*):/gm)].map((m) => m[1])

  const row = /function eventToRow_\(event\) \{([\s\S]*?)\n\}/.exec(gas)
  assert.ok(row, "GASのeventToRow_が見つからない")
  const written = new Set([...row[1].matchAll(/properties\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1]))

  for (const key of gasKeys) {
    assert.ok(written.has(key), `行に書き出されていないプロパティ: ${key}`)
  }
})

// 記事CTAシートはQUERYで列記号（L, T, AN…）を直接指定している。
// EVENT_HEADERS に列を1本足すと以降の記号が全部ずれ、
// 「CTA種別」のつもりで別の列を集計しても、数字は出るので誤りに気づけない。
test("the cta sheet queries the columns it means to query", () => {
  const headerBlock = /const EVENT_HEADERS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(gas)
  const headers = [...headerBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1])

  const letterOf = (index) => {
    let out = ""
    let n = index + 1
    while (n > 0) {
      const remainder = (n - 1) % 26
      out = String.fromCharCode(65 + remainder) + out
      n = Math.floor((n - 1) / 26)
    }
    return out
  }

  const columnFor = (headerName) => {
    const index = headers.indexOf(headerName)
    assert.ok(index >= 0, `イベントデータに列がない: ${headerName}`)
    return letterOf(index)
  }

  const body = /function configureCtaSheet_\(sheet\) \{([\s\S]*?)\n\}/.exec(gas)
  assert.ok(body, "GASのconfigureCtaSheet_が見つからない")

  // 「この見出しの列を、この用途で集計している」の対応表
  const expected = [
    ["イベント", "book_cta_click の絞り込み"],
    ["UTM Campaign", "記事別"],
    ["ロケーション", "CTA設置位置別"],
    ["プランID", "誘導先プラン別"],
    ["CTA種別", "CTA種別別"],
    ["CTAボタン文言", "ボタン文言別"],
  ]

  for (const [headerName, usage] of expected) {
    const column = columnFor(headerName)
    assert.ok(
      new RegExp(`select ${column},|,count\\(${column}\\)|select ${column}\\b|\\b${column}=|and ${column} is not null`).test(body[1]),
      `${usage}: 「${headerName}」は ${column} 列のはずだが、その列を参照していない`,
    )
  }
})

test("the events sheet has one header per written column", () => {
  const headerBlock = /const EVENT_HEADERS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(gas)
  const headers = [...headerBlock[1].matchAll(/'([^']+)'/g)].length

  const rowBlock = /function eventToRow_\(event\) \{[\s\S]*?return \[([\s\S]*?)\n  \];/.exec(gas)
  const cells = rowBlock[1].split("\n").filter((line) => line.trim().length > 0).length

  assert.equal(headers, cells, "EVENT_HEADERSとeventToRow_の列数が一致していない")
})

test("the reservation sheet appends every customer analytics column without moving existing columns", () => {
  const headersBlock = /var HEADERS = \[([\s\S]*?)\];/.exec(reservationGas)
  const columnsBlock = /var COLUMNS = \{([\s\S]*?)\};/.exec(reservationGas)
  assert.ok(headersBlock, "予約シートのHEADERSが見つからない")
  assert.ok(columnsBlock, "予約シートのCOLUMNSが見つからない")

  const headers = [...headersBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1])
  const columnNumbers = [...columnsBlock[1].matchAll(/:\s*(\d+)/g)].map((match) => Number(match[1]))
  assert.equal(Math.max(...columnNumbers), headers.length, "予約シートの列番号と見出し数が一致していない")
  assert.deepEqual(headers.slice(0, 19), [
    "受付日時", "予約番号", "参加日", "時間", "名前", "プラン", "合計金額", "電話", "ステータス",
    "人数内訳", "参加者詳細", "lineUserId", "予約ステータス", "開催場所", "LINE名", "スタッフ指名",
    "クーポンコード", "クーポン割引額", "LINE送信",
  ])
  for (const required of [
    "メールアドレス", "Visitor ID", "Visit ID", "予約ファネルID", "行動履歴連携同意日時",
    "参加者年齢", "参加者身長", "参加者体重", "参加者足サイズ", "特別なご要望・アレルギー等",
  ]) {
    assert.ok(headers.includes(required), `予約台帳に必要な列がない: ${required}`)
  }
  assert.match(reservationGas, /function ensureBookingSchema_\(sheet\)/)
  assert.match(reservationGas, /sheet\.insertColumnsAfter\(sheet\.getMaxColumns\(\), missingColumns\)/)
})

// ============================================================
// 個人情報
// ============================================================

test("no analytics property key can carry personal data", () => {
  const forbidden = [
    /name$/i,
    /^customer/i,
    /phone/i,
    /email/i,
    /address/i,
    /birth/i,
    /token/i,
    /userid$/i,
    /displayname/i,
    /^age$/i,
    /^height$/i,
    /^weight$/i,
    /footsize/i,
    /ipaddress/i,
    /cookie/i,
    /useragent/i,
  ]

  // planName / ctaLabel は運営が定義した固定文字列で、利用者の入力ではない
  const allowedExceptions = new Set(["planName", "ctaLabel", "vitalName"])

  for (const key of ANALYTICS_PROPERTY_KEYS) {
    if (allowedExceptions.has(key)) continue
    for (const pattern of forbidden) {
      assert.ok(
        !pattern.test(key),
        `個人情報を運びうるプロパティ名: ${key}（${pattern}）`,
      )
    }
  }
})

test("every property the funnel actually sends is an approved analytics key", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/booking-funnel.ts"), "utf8")

  // locale は GA4 / Vercel Analytics 向けのプロパティ。
  // スプレッドシートには DetailedAnalyticsEvent のトップレベル locale（言語列）が
  // 入るため、properties 側の locale は API で落ちる。重複だが害はない。
  const approved = new Set([...ANALYTICS_PROPERTY_KEYS, "locale"])

  // emit(...) と sendDetailedEventBeacon(...) に渡すオブジェクトのキーだけを取り出す。
  // 関数の引数名ではなく「実際に送る値」を見るので、内部で日付を受け取って区分へ
  // 変換するヘルパーは誤検知しない。波括弧を数えて payload の範囲を正確に切り出す。
  const payloads = []
  const callPattern = /(?:emitBeforeNavigation|emit|sendDetailedEventBeacon)\(\s*"[a-z_]+",\s*\{/g
  let call
  while ((call = callPattern.exec(source)) !== null) {
    let depth = 1
    let index = call.index + call[0].length
    while (index < source.length && depth > 0) {
      if (source[index] === "{") depth++
      else if (source[index] === "}") depth--
      index++
    }
    payloads.push(source.slice(call.index + call[0].length, index - 1))
  }

  assert.ok(payloads.length >= 10, `送信箇所を検出できていない（${payloads.length}件）`)

  for (const body of payloads) {
    const keys = [...body.matchAll(/(?:^|[{,])\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/gm)].map((m) => m[1])
    assert.ok(keys.length > 0, `payloadのキーを取得できない: ${body.slice(0, 60)}`)

    for (const key of keys) {
      assert.ok(
        approved.has(key),
        `未承認のプロパティを送っている: ${key}（ANALYTICS_PROPERTY_KEYS に無い）`,
      )
    }
  }
})

test("the funnel module never reads a raw personal value from the form", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/booking-funnel.ts"), "utf8")

  // 氏名・電話・メール・自由記述・LINEの識別子は、引数としても受け取らない
  for (const banned of [
    "customerName",
    "customerPhone",
    "customerEmail",
    "specialRequests",
    "lineUserId",
    "lineIdToken",
    "displayName",
    "footSize",
    "selectedTime",
  ]) {
    assert.ok(!source.includes(banned), `送信モジュールが個人情報に触れている: ${banned}`)
  }
})

// ============================================================
// ファネルは「回数」ではなく「到達した人数」を数える
// ============================================================

test("every funnel stage fires at most once per page view", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/booking-funnel.ts"), "utf8")

  // ファネルの流れを構成するステージ。値が変わるたびに再送すると到達率が
  // 100%を超えて読めなくなる（実際に「料金表示 360%」が出た）ため、1回きりに固定する。
  // ただし単位は「予約フォーム1回分」でなければならない。モジュール読み込み単位
  // （claimOnce）だと、同じタブでの2回目の予約でステージだけが記録されず、
  // 1回きり制御を持たない booking_submitted が上回って到達率が再び壊れる。
  const funnelStageSenders = [
    "trackBookingFormView",
    "trackBookingStarted",
    "trackPlanSelected",
    "trackDateSelected",
    "trackTimeSelected",
    "trackParticipantsCompleted",
    "trackPriceConfirmed",
    "trackRepresentativeCompleted",
    "trackParticipantDetailsStarted",
    "trackParticipantDetailsCompleted",
    "trackSubmitClicked",
  ]

  for (const name of funnelStageSenders) {
    const start = source.indexOf(`export function ${name}(`)
    assert.ok(start >= 0, `送信関数が見つからない: ${name}`)

    const next = source.indexOf("\nexport ", start + 1)
    const body = source.slice(start, next === -1 ? source.length : next)

    assert.ok(
      body.includes("claimOncePerBooking("),
      `${name}: ファネルのステージなのに予約1回分の1回きり制御がない`,
    )
    assert.ok(
      !body.includes("claimChanged("),
      `${name}: claimChanged を使うと同じ人が何度も数えられ、到達率が壊れる`,
    )
  }
})

test("a second booking in the same tab is counted again", () => {
  resetFunnelDedupeForTest()

  // 1回目：各ステージは1回きり
  assert.equal(claimOncePerBooking("booking_form_view"), true)
  assert.equal(claimOncePerBooking("booking_form_view"), false)
  assert.equal(claimOncePerBooking("booking_submit_clicked"), true)

  // 2回目の予約フォームに入ったら、また数え直せること。
  // ここが効かないと booking_submitted だけが増えて到達率が100%を超える。
  beginBookingFunnelSession()
  assert.equal(claimOncePerBooking("booking_form_view"), true)
  assert.equal(claimOncePerBooking("booking_submit_clicked"), true)
})

test("line login round-trip stays once per page view, not per booking", () => {
  resetFunnelDedupeForTest()

  assert.equal(claimOnce("line_login_returned"), true)
  // 予約フォームを開き直しても、同じページ表示中の復帰は二重に数えない
  beginBookingFunnelSession()
  assert.equal(claimOnce("line_login_returned"), false)
})

test("validation errors still report each distinct combination", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/booking-funnel.ts"), "utf8")
  const start = source.indexOf("export function trackValidationError(")
  const next = source.indexOf("\nexport ", start + 1)
  const body = source.slice(start, next === -1 ? source.length : next)

  // 不足項目の組み合わせは変わるたびに知りたいので、ここだけは claimChanged のまま
  assert.ok(body.includes("claimChanged("), "不足項目の記録が1回きりになっている")
})
