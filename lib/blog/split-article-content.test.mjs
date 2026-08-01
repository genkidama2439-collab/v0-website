import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs"

import { splitArticleContent } from "./split-article-content.ts"

const RATIOS = [0.25, 0.6]

function join(segments) {
  return segments.join("\n\n")
}

test("splits into one more segment than the number of ratios", () => {
  const content = Array.from({ length: 20 }, (_, i) => `段落${i}です。`.repeat(10)).join("\n\n")
  const segments = splitArticleContent(content, RATIOS)
  assert.equal(segments.length, 3)
})

test("keeps every block, in order, with nothing added or dropped", () => {
  const content = Array.from({ length: 20 }, (_, i) => `段落${i}`).join("\n\n")
  const segments = splitArticleContent(content, RATIOS)
  assert.equal(join(segments), content)
})

test("never splits a heading away from the text that follows it", () => {
  const content = [
    "導入の段落です。".repeat(20),
    "## 見出しA",
    "見出しAの本文です。".repeat(20),
    "## 見出しB",
    "見出しBの本文です。".repeat(20),
    "## 見出しC",
    "見出しCの本文です。".repeat(20),
  ].join("\n\n")

  for (const segment of splitArticleContent(content, RATIOS)) {
    assert.ok(!/^#{1,6}\s[^\n]*$/.test(segment.trim()), `見出しだけのセグメントができた: ${segment}`)
  }
})

test("never splits inside a fenced code block", () => {
  const content = [
    "前置きです。".repeat(30),
    "```\nline1\nline2\n```",
    "後の段落です。".repeat(30),
    "続きの段落です。".repeat(30),
  ].join("\n\n")

  for (const segment of splitArticleContent(content, RATIOS)) {
    const fences = (segment.match(/^```/gm) || []).length
    assert.equal(fences % 2, 0, `コードブロックが割れた: ${segment}`)
  }
})

test("never starts a segment with a list item, quote or table row", () => {
  const content = [
    "前置きです。".repeat(20),
    "注意点は次のとおりです。",
    "- 一つ目\n- 二つ目",
    "次の段落です。".repeat(20),
    "> 引用です",
    "さらに段落です。".repeat(20),
    "最後の段落です。".repeat(20),
  ].join("\n\n")

  for (const segment of splitArticleContent(content, RATIOS)) {
    assert.ok(
      !/^\s*([-*+]\s|\d+[.)]\s|>|\|)/.test(segment),
      `リスト・引用の途中で割れた: ${segment.slice(0, 40)}`,
    )
  }
})

test("returns the whole content untouched when it is too short to split", () => {
  assert.deepEqual(splitArticleContent("一段落だけ。", RATIOS), ["一段落だけ。"])
})

test("splits the real target articles into three parts without losing text", () => {
  for (const slug of ["aragusu-beach-snorkeling-guide", "miyakojima-kids-snorkeling-age-guide"]) {
    const raw = fs.readFileSync(new URL(`../../content/blog/${slug}.md`, import.meta.url), "utf8")
    const body = raw.replace(/^---[\s\S]*?\n---\n/, "").trim()

    const segments = splitArticleContent(body, RATIOS)
    assert.equal(segments.length, 3, `${slug} が3分割されなかった`)

    // 記号や空行の正規化を挟むため、文字だけを取り出して欠落がないことを確かめる
    const strip = (text) => text.replace(/\s+/g, "")
    assert.equal(strip(join(segments)), strip(body), `${slug} で本文が欠落した`)

    const first = segments[0].length
    const second = segments[0].length + segments[1].length
    const total = strip(body).length
    assert.ok(first > 0 && second > first, `${slug} の分割位置が不正`)
    assert.ok(first / total < 0.55, `${slug} の1つ目のCTAが後ろすぎる`)
  }
})
