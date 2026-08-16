// FAQ単一ソース化の検査。
//
// 2026-08-16の情報設計監査で、日本語FAQが3箇所（lib/data.ts・トップページ・
// ピラーページ）に分かれて書かれており、同じ質問が別々の回答で存在していても
// 気づけない状態だった。lib/faq.ts へ集約したうえで、次を固定する。
//
//   1. 移設で文言が1字も変わっていないこと（検索評価を動かさないため）
//   2. 表示とFAQPage構造化データが同じ配列から作られること
//   3. 新しい重複が増えたら気づけること
//
// 1の検査には、集約前のコミットのファイル内容を git から読んで突き合わせる。

import assert from "node:assert/strict"
import test from "node:test"
import { execSync } from "node:child_process"

import { FAQ_ENTRIES, getAllFaqs, getFaqs } from "./faq.ts"
import { PLAN_DETAILS } from "./plan-details.ts"

/** 集約前のコミット。ここから元の文言を読み出して比較する。 */
const BEFORE_REF = "7096268"

function readArrayFromRef(path, name) {
  const src = execSync(`git show ${BEFORE_REF}:"${path}"`, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  const block = src.match(new RegExp(`const ${name}\\s*=\\s*\\[([\\s\\S]*?)\\n\\]`))
  assert.ok(block, `${path} の ${name} を読み取れなかった`)

  const entries = []
  for (const item of block[1].matchAll(
    /\{\s*question:\s*"((?:[^"\\]|\\.)*)",\s*answer:\s*\n?\s*"((?:[^"\\]|\\.)*)",?\s*\}/g,
  )) {
    entries.push({ question: item[1], answer: item[2] })
  }
  return entries
}

test("移設でFAQの文言が変わっていない（トップページ）", () => {
  const before = readArrayFromRef("components/home/faq-section.tsx", "faqs")
  const after = getFaqs("home").map((entry) => ({ question: entry.question, answer: entry.answer }))

  assert.equal(after.length, before.length, "件数が変わっている")
  assert.deepEqual(after, before, "トップページのFAQ文言または順序が変わっている")
})

test("移設でFAQの文言が変わっていない（ピラーページ）", () => {
  const before = readArrayFromRef("app/(ja)/miyakojima-sea-turtle/page.tsx", "FAQS")
  const after = getFaqs("sea-turtle-guide").map((entry) => ({ question: entry.question, answer: entry.answer }))

  assert.equal(after.length, before.length, "件数が変わっている")
  assert.deepEqual(after, before, "ピラーページのFAQ文言または順序が変わっている")
})

test("移設でFAQの文言が変わっていない（/faq・リンクを含む）", () => {
  const src = execSync(`git show ${BEFORE_REF}:lib/data.ts`, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
  const block = src.match(/export const FAQS: FAQ\[\] = \[([\s\S]*?)\n\]/)
  assert.ok(block, "集約前の FAQS を読み取れなかった")

  const questions = [...block[1].matchAll(/question:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
  const links = [...block[1].matchAll(/link:\s*\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*\}/g)].map((m) => ({
    href: m[1],
    label: m[2],
  }))

  const after = getFaqs("faq-page")
  assert.deepEqual(
    after.map((entry) => entry.question),
    questions,
    "/faq の質問文または順序が変わっている",
  )

  // 回答の下に出す関連リンクが落ちていないこと（移設で失いやすい）
  assert.deepEqual(
    after.filter((entry) => entry.link).map((entry) => entry.link),
    links,
    "/faq の関連リンクが失われている、または変わっている",
  )
  assert.equal(links.length, 2, "集約前のリンク数が想定と違う（テストの前提を確認すること）")
})

test("すべてのFAQがどこかの面に出る（迷子がない）", () => {
  for (const entry of FAQ_ENTRIES) {
    assert.ok(entry.scopes.length > 0, `${entry.id}: どの面にも表示されない`)
    assert.ok(entry.question.trim(), `${entry.id}: 質問文が空`)
    assert.ok(entry.answer.trim(), `${entry.id}: 回答が空`)
  }
})

test("FAQのidが重複していない", () => {
  const ids = FAQ_ENTRIES.map((entry) => entry.id)
  assert.equal(new Set(ids).size, ids.length, `idが重複している: ${ids.join(", ")}`)
})

test("同じ質問が複数の面に別々の回答で存在していないか（既知の1件を除く）", () => {
  // home-04 と guide-04 は質問文が同じ「持ち物は何が必要ですか？」だが回答が異なる。
  // どちらも内容は正しく、ページごとの言い回しの違いのため統合していない。
  const KNOWN_DUPLICATES = [["home-04", "guide-04"]]
  const isKnown = (a, b) =>
    KNOWN_DUPLICATES.some((pair) => pair.includes(a) && pair.includes(b))

  const normalize = (text) => text.replace(/[\s？?、。「」・]/g, "")
  const found = []

  for (let i = 0; i < FAQ_ENTRIES.length; i++) {
    for (let j = i + 1; j < FAQ_ENTRIES.length; j++) {
      const a = FAQ_ENTRIES[i]
      const b = FAQ_ENTRIES[j]
      if (normalize(a.question) !== normalize(b.question)) continue
      if (isKnown(a.id, b.id)) continue
      found.push(`${a.id}「${a.question}」 と ${b.id}「${b.question}」`)
    }
  }

  assert.deepEqual(
    found,
    [],
    `同じ質問が複数箇所にあります。lib/faq.ts でscopesをまとめるか、既知の重複としてテストへ追記してください:\n  ${found.join("\n  ")}`,
  )
})

test("プラン詳細ページのFAQが構造化データとして出力される", () => {
  const src = execSync('git show HEAD:"app/(ja)/plans/[id]/page.tsx"', { encoding: "utf8" })
  // 変更前は FAQJsonLd を使っていなかった。現在のファイルで検査する。
  const current = execSync('cat "app/(ja)/plans/[id]/page.tsx"', { encoding: "utf8" })

  assert.ok(current.includes("FAQJsonLd"), "プラン詳細ページで FAQPage 構造化データを出力していない")
  assert.ok(
    /plan\.faqs\.map\(/.test(current),
    "構造化データが plan.faqs（画面に表示している配列）から作られていない",
  )
  assert.ok(src.length > 0, "比較用の読み取りに失敗")
})

test("プラン別FAQが全プランに存在し、空でない", () => {
  let total = 0
  for (const [planId, detail] of Object.entries(PLAN_DETAILS)) {
    assert.ok(Array.isArray(detail.faqs), `${planId}: faqs が配列でない`)
    for (const faq of detail.faqs) {
      assert.ok(faq.q?.trim(), `${planId}: 質問文が空`)
      assert.ok(faq.a?.trim(), `${planId}: 回答が空`)
    }
    total += detail.faqs.length
  }
  assert.ok(total >= 60, `プラン別FAQが想定より少ない（${total}件）`)
})

test("getAllFaqs が全件を返す", () => {
  assert.equal(getAllFaqs().length, FAQ_ENTRIES.length)
  assert.equal(
    getFaqs("faq-page").length + getFaqs("home").length + getFaqs("sea-turtle-guide").length,
    FAQ_ENTRIES.length,
    "どの面にも属さない、または重複して数えられているFAQがある",
  )
})
