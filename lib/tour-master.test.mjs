// ツアー情報の重複が将来ズレないよう見張るテスト。
//
// 2026-08-14の情報設計監査（docs/ai-readiness-audit.md）で、同じ事実が最大5箇所へ
// 手書きされていることが分かった。値そのものは今のところ全て一致しているが、
// 同期は完全に手作業のため、どこか1箇所だけ直すとサイレントにズレる。
//
// ここでは「今は一致している」ことを固定し、片方だけ変更されたら止める。
// 表記の統一や、監査で見つかった矛盾（M1〜M6）の修正はオーナー確認が必要なため、
// このテストでは扱わない。

import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

import { TOUR_MASTER, TOUR_MASTER_BY_ID, getPublicTours, getToursForLocale } from "./tour-master.ts"
import { PLANS } from "./data.ts"
import { PLAN_DETAILS } from "./plan-details.ts"
import { PLAN_PRICE_DATA } from "./plan-price-display.ts"
import { INTL_PLAN_IDS } from "./i18n/locales.ts"
import { RENTAL_UNIT_PRICE_YEN, getRentalUnitPrice } from "./rental-options.ts"
import { FREE_UNDER3_PLAN_IDS, SENIOR_RESTRICTED_PLAN_IDS } from "./plan-flags.ts"

const yen = (value) => `¥${Number(value).toLocaleString()}`

test("統合ビューは全プランを網羅し、識別子が予約システムと一致する", () => {
  assert.equal(TOUR_MASTER.length, PLANS.length, "PLANS と件数が違う")

  for (const tour of TOUR_MASTER) {
    const plan = PLANS.find((candidate) => candidate.id === tour.id)
    assert.ok(plan, `${tour.id}: PLANS に存在しない`)

    // 予約APIへ送る planId と、GASのシートへ書かれるプラン名。ここがズレると予約が壊れる。
    assert.equal(tour.bookingPlanId, plan.id, `${tour.id}: bookingPlanId が PLANS と不一致`)
    assert.equal(tour.slug, plan.id, `${tour.id}: slug が planId と不一致`)
    assert.equal(
      tour.sheetPlanName,
      plan.name,
      `${tour.id}: sheetPlanName が、実際にGASへ送られる PLANS[].name と不一致`,
    )
  }
})

test("料金は PLAN_PRICE_DATA が唯一の起点になっている", () => {
  for (const tour of TOUR_MASTER) {
    const master = PLAN_PRICE_DATA[tour.id]
    assert.ok(master, `${tour.id}: PLAN_PRICE_DATA に定義がない`)

    assert.equal(tour.pricing.adult, master.price, `${tour.id}: 大人料金`)
    assert.equal(tour.pricing.child, master.childPrice ?? master.price, `${tour.id}: 子供料金`)
    assert.equal(
      tour.pricing.under3,
      FREE_UNDER3_PLAN_IDS.has(tour.id) ? 0 : master.childPrice ?? master.price,
      `${tour.id}: 3歳未満料金`,
    )

    // 予約APIが実際に請求する金額の元になる PLANS[].price とも一致していること
    const plan = PLANS.find((candidate) => candidate.id === tour.id)
    assert.equal(tour.pricing.adult, plan.price, `${tour.id}: PLANS[].price と不一致`)
  }
})

test("プラン詳細ページの料金文字列が料金マスタと一致する", () => {
  for (const [planId, detail] of Object.entries(PLAN_DETAILS)) {
    const master = PLAN_PRICE_DATA[planId]
    if (!master) continue

    assert.equal(
      detail.price,
      yen(master.price),
      `${planId}: plan-details の price 表示が料金マスタと不一致`,
    )

    if (detail.childPrice && master.childPrice) {
      assert.ok(
        detail.childPrice.includes(yen(master.childPrice)),
        `${planId}: plan-details の childPrice 表示（${detail.childPrice}）が料金マスタ（${yen(master.childPrice)}）を含まない`,
      )
    }
  }
})

test("JSON-LD の makesOffer が料金マスタ・プラン名と一致する", () => {
  const source = readFileSync(new URL("../components/json-ld.tsx", import.meta.url), "utf8")
  const offersBlock = source.match(/makesOffer:\s*\[([\s\S]*?)\n {4}\],/)
  assert.ok(offersBlock, "makesOffer ブロックを読み取れなかった（json-ld.tsx の構造が変わった可能性）")

  const offers = [...offersBlock[1].matchAll(
    /name:\s*"([^"]+)",\s*price:\s*"(\d+)",\s*priceCurrency:\s*"JPY",\s*url:\s*`\$\{SITE_URL\}\/plans\/([A-Za-z0-9-]+)`/g,
  )]
  assert.ok(offers.length > 0, "makesOffer から Offer を抽出できなかった")

  for (const [, name, price, planId] of offers) {
    const master = PLAN_PRICE_DATA[planId]
    assert.ok(master, `JSON-LD: 未知のプランID ${planId}`)
    assert.equal(
      Number(price),
      master.price,
      `JSON-LD: ${planId} の料金 ${price} が料金マスタ（${master.price}）と不一致`,
    )

    // 名前は現状ずれているものがある（監査 M8）。実名と違う場合に気づけるよう記録だけする。
    const actualName = PLAN_DETAILS[planId]?.name
    if (actualName && actualName !== name) {
      console.log(`  ⚠ JSON-LD の ${planId} の name「${name}」は実際のプラン名「${actualName}」と異なる`)
    }
  }
})

test("JSON-LD の priceRange が実際の最安・最高料金と一致する", () => {
  const source = readFileSync(new URL("../components/json-ld.tsx", import.meta.url), "utf8")
  const range = source.match(/priceRange:\s*"¥([\d,]+)〜¥([\d,]+)"/)
  assert.ok(range, "priceRange を読み取れなかった")

  const prices = Object.values(PLAN_PRICE_DATA).map((entry) => entry.price)
  const lowest = Math.min(...prices)
  const highest = Math.max(...prices)

  assert.equal(Number(range[1].replace(/,/g, "")), lowest, "priceRange の下限が最安プランと不一致")
  assert.equal(Number(range[2].replace(/,/g, "")), highest, "priceRange の上限が最高額プランと不一致")
})

test("参加条件が予約ルールから導出されている", () => {
  for (const tour of TOUR_MASTER) {
    assert.equal(
      tour.participants.seniorRestricted,
      SENIOR_RESTRICTED_PLAN_IDS.has(tour.id),
      `${tour.id}: 60歳制限の判定`,
    )

    // 60歳制限があるプランには必ず案内先の貸切版がある（案内が行き止まりにならない）
    if (tour.participants.seniorRestricted) {
      assert.ok(
        tour.participants.seniorAlternativeId,
        `${tour.id}: 60歳以上の案内先が設定されていない`,
      )
      assert.ok(
        TOUR_MASTER_BY_ID[tour.participants.seniorAlternativeId],
        `${tour.id}: 案内先 ${tour.participants.seniorAlternativeId} が存在しない`,
      )
    }

    assert.ok(tour.participants.adultAgeMin > 0, `${tour.id}: 大人の下限年齢が取れていない`)
    assert.ok(
      tour.participants.childAgeMax >= tour.participants.childAgeMin,
      `${tour.id}: 子供の年齢範囲が逆転している`,
    )
  }
})

test("レンタル料金が貸切プランで無料になっている", () => {
  for (const tour of TOUR_MASTER) {
    assert.equal(
      tour.pricing.rentalUnitPrice,
      getRentalUnitPrice(tour.id),
      `${tour.id}: レンタル単価`,
    )

    if (tour.isPrivate) {
      assert.equal(tour.pricing.rentalUnitPrice, 0, `${tour.id}: 貸切プランのレンタルが有料になっている`)
    } else if (tour.pricing.rentalAvailable) {
      assert.equal(
        tour.pricing.rentalUnitPrice,
        RENTAL_UNIT_PRICE_YEN,
        `${tour.id}: 通常プランのレンタル単価が ${RENTAL_UNIT_PRICE_YEN} 円でない`,
      )
    }
  }
})

test("開始時刻が予約APIの受理する値と一致する", () => {
  for (const tour of TOUR_MASTER) {
    const plan = PLANS.find((candidate) => candidate.id === tour.id)
    const accepted = plan.timeTags.filter((tag) => /^\d{2}:\d{2}$/.test(tag))

    assert.deepEqual(
      tour.schedule.startTimes,
      accepted,
      `${tour.id}: 開始時刻が予約APIの検証値と不一致`,
    )

    // 夜の部を持つセットは必ず夜の開始時刻を持つ
    if (tour.isSet && tour.schedule.nightStartTimes.length === 0) {
      assert.ok(
        !/ヤシガニ|ナイト/.test(tour.setContents),
        `${tour.id}: セット内容に夜のツアーがあるのに夜の開始時刻がない`,
      )
    }
  }
})

test("外国語サイトの掲載範囲が INTL_PLAN_IDS と一致する", () => {
  for (const tour of TOUR_MASTER) {
    const expected = INTL_PLAN_IDS.includes(tour.id)
    assert.equal(
      tour.visibility.intlLocales.length > 0,
      expected,
      `${tour.id}: 外国語掲載の判定が INTL_PLAN_IDS と不一致`,
    )
  }

  for (const locale of ["en", "ko", "zh-tw"]) {
    const tours = getToursForLocale(locale)
    assert.deepEqual(
      tours.map((tour) => tour.id).sort(),
      [...INTL_PLAN_IDS].sort(),
      `${locale}: 掲載プランが INTL_PLAN_IDS と不一致`,
    )
  }

  assert.equal(getToursForLocale("ja").length, TOUR_MASTER.length, "日本語は全プラン掲載")
})

test("AIへ公開するビューに予約システム内部の値が混ざらない", () => {
  // GASのシート・LINE・カレンダー側の識別子や秘密情報が公開ビューへ漏れないことを固定する。
  const FORBIDDEN = [
    /NOTIFY_SECRET/,
    /lineUserId/i,
    /docs\.google\.com/,
    /1bPYur/, // スプレッドシートID
    /genkidama2439/, // 管理者メール・カレンダーID
    /@gmail\.com/,
    /script\.google\.com/,
  ]

  const serialized = JSON.stringify(getPublicTours())
  for (const pattern of FORBIDDEN) {
    assert.ok(!pattern.test(serialized), `公開ビューに内部情報が含まれている: ${pattern}`)
  }

  // GAS内部のセット分割プラン名も公開しない（シート上の行名であり、お客様向けの名前ではない）
  for (const internalName of [
    "昼夜セット海亀",
    "昼夜セットヤシガニ",
    "海空セット（ウミガメシュノーケル）",
    "まるごと1日セット海亀",
    "貸切まるごと1日セット海亀",
  ]) {
    assert.ok(
      !serialized.includes(internalName),
      `公開ビューにGAS内部のプラン名が含まれている: ${internalName}`,
    )
  }
})

test("統合ビューが新しい事実を持ち込んでいない（本文は plan-details と同一）", () => {
  for (const tour of TOUR_MASTER) {
    const detail = PLAN_DETAILS[tour.id]

    assert.equal(tour.displayName, detail.name, `${tour.id}: displayName`)
    assert.equal(tour.content.tagline, detail.tagline, `${tour.id}: tagline`)
    assert.equal(tour.content.summary, detail.heroDescription, `${tour.id}: summary`)
    assert.deepEqual(tour.content.whatToBring, detail.whatToBring, `${tour.id}: 持ち物`)
    assert.deepEqual(tour.content.precautions, detail.precautions, `${tour.id}: 注意事項`)
    assert.equal(tour.content.faqs.length, detail.faqs.length, `${tour.id}: FAQ件数`)
    assert.equal(tour.participants.displayAgeRange, detail.age, `${tour.id}: 表示用の対象年齢`)
    assert.equal(tour.schedule.durationLabel, detail.duration, `${tour.id}: 表示用の所要時間`)
  }
})
