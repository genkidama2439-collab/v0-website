import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"
import path from "node:path"

import {
  ARTICLE_CTA_CONFIGS,
  buildCtaUtm,
  getCtaPriceNote,
  resolveRelatedContent,
  withCtaUtm,
} from "./article-cta.ts"
import { PLAN_DETAILS } from "../plan-details.ts"

const BLOG_DIR = new URL("../../content/blog/", import.meta.url)
const APP_DIR = new URL("../../app/", import.meta.url)

const configs = Object.entries(ARTICLE_CTA_CONFIGS)
const allActions = configs.flatMap(([key, config]) => [
  ...config.cards.flatMap((card) => [card.primary, ...(card.secondary ? [card.secondary] : [])]),
  { ...config.sticky, key },
])

test("every configured plan id exists in PLAN_DETAILS", () => {
  for (const action of allActions) {
    if (!action.planId) continue
    assert.ok(PLAN_DETAILS[action.planId], `存在しないプランID: ${action.planId} (${action.label})`)
  }

  for (const [, config] of configs) {
    for (const item of config.related) {
      if (item.kind !== "plan") continue
      assert.ok(PLAN_DETAILS[item.planId], `関連コンテンツに存在しないプランID: ${item.planId}`)
    }
  }
})

test("every internal href points at a page that exists", () => {
  const planIds = new Set(Object.keys(PLAN_DETAILS))

  const exists = (href) => {
    const pathOnly = href.split("?")[0].split("#")[0]
    if (pathOnly === "/book") return true
    if (pathOnly.startsWith("/plans/")) return planIds.has(pathOnly.replace("/plans/", ""))
    if (pathOnly.startsWith("/blog/")) {
      return fs.existsSync(new URL(`${pathOnly.replace("/blog/", "")}.md`, BLOG_DIR))
    }
    return fs.existsSync(path.join(APP_DIR.pathname, "(ja)", pathOnly, "page.tsx"))
  }

  for (const action of allActions) {
    if (action.external) continue
    assert.ok(action.href.startsWith("/"), `内部リンクではない: ${action.href}`)
    assert.ok(exists(action.href), `存在しないURL: ${action.href} (${action.label})`)
  }
})

test("every related blog slug exists as a markdown file", () => {
  for (const [, config] of configs) {
    for (const item of config.related) {
      if (item.kind !== "post") continue
      assert.ok(
        fs.existsSync(new URL(`${item.slug}.md`, BLOG_DIR)),
        `存在しない記事スラッグ: ${item.slug}`,
      )
    }
  }
})

// キーは app/(ja)/blog/[slug]/page.tsx が渡す post.id（= content/blog/<slug>.md のファイル名）。
// 綴りを1文字間違えるとCTAが黙って描画されなくなり、記事は表示されるので気づけない。
test("every blog config key matches a real article slug", () => {
  for (const [key] of configs) {
    if (key.startsWith("/")) continue // ピラーページはページパス指定
    assert.ok(
      fs.existsSync(new URL(`${key}.md`, BLOG_DIR)),
      `CTA定義のキーに対応する記事が無い: ${key}`,
    )
  }
})

test("every article that exists has a booking cta defined", () => {
  const slugs = fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""))

  const missing = slugs.filter((slug) => !ARTICLE_CTA_CONFIGS[slug])

  // 記事は書けているのに予約導線が無い状態を作らない。
  // 実データで、CTAの無い記事は600表示を超えて予約0件だった。
  assert.deepEqual(missing, [], `予約導線が未定義の記事: ${missing.join(", ")}`)
})

test("each article has all three card positions and a unique utm campaign", () => {
  const campaigns = new Set()

  for (const [key, config] of configs) {
    const positions = config.cards.map((card) => card.position)
    assert.deepEqual(
      [...positions].sort(),
      ["article_bottom", "article_middle", "article_top"],
      `${key} のCTA位置が揃っていない`,
    )
    assert.ok(!campaigns.has(config.campaign), `utm_campaign が重複: ${config.campaign}`)
    campaigns.add(config.campaign)
  }
})

test("no article repeats the same destination twice within one card", () => {
  for (const [key, config] of configs) {
    for (const card of config.cards) {
      if (!card.secondary) continue
      assert.notEqual(
        card.primary.href,
        card.secondary.href,
        `${key} の ${card.position} で主従ボタンの遷移先が同じ`,
      )
    }
  }
})

test("cta labels are specific, never a bare 予約はこちら", () => {
  for (const action of allActions) {
    assert.ok(action.label.length >= 6, `文言が短すぎる: ${action.label}`)
    assert.notEqual(action.label, "予約はこちら")
    assert.notEqual(action.label, "今すぐ予約")
  }
})

test("withCtaUtm keeps existing query params and appends the campaign set", () => {
  const href = withCtaUtm("/book?plan=S1", "aragusu_guide", "article_middle")
  const params = new URLSearchParams(href.split("?")[1])

  assert.equal(href.split("?")[0], "/book")
  assert.equal(params.get("plan"), "S1", "プラン事前選択のパラメータが消えている")
  assert.equal(params.get("utm_source"), "blog")
  assert.equal(params.get("utm_medium"), "article_cta")
  assert.equal(params.get("utm_campaign"), "aragusu_guide")
  assert.equal(params.get("utm_content"), "article_middle")
})

test("withCtaUtm leaves external links untouched", () => {
  const line = "https://lin.ee/jfp4laz"
  assert.equal(withCtaUtm(line, "aragusu_guide", "article_top"), line)
})

test("buildCtaUtm produces the documented parameter set", () => {
  assert.deepEqual(buildCtaUtm("kids_age_guide", "sticky_mobile"), {
    utm_source: "blog",
    utm_medium: "article_cta",
    utm_campaign: "kids_age_guide",
    utm_content: "sticky_mobile",
  })
})

test("price notes come from the shared price data, not hardcoded copy", () => {
  const card = ARTICLE_CTA_CONFIGS["aragusu-beach-snorkeling-guide"].cards.find(
    (item) => item.position === "article_middle",
  )
  assert.equal(getCtaPriceNote(card), "大人¥6,500 / 子供¥6,000")
})

test("resolveRelatedContent drops unknown entries instead of rendering broken cards", () => {
  const items = resolveRelatedContent(
    [
      { kind: "plan", planId: "S1", description: "説明" },
      { kind: "plan", planId: "NOPE", description: "説明" },
      { kind: "post", slug: "missing-post", description: "説明" },
    ],
    () => undefined,
  )

  assert.equal(items.length, 1)
  assert.equal(items[0].href, "/plans/S1")
  assert.ok(items[0].image.length > 0)
})
