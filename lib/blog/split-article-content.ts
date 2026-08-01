// 記事本文（Markdown）を、指定した読み進み割合の位置で分割する。
//
// 分割はブロック（空行区切り）の境界でのみ行い、見出し・リスト・コードブロックを
// 途中で割らない。だから既存の記事構造とSEO見出しはそのまま保たれ、
// 目次のアンカーIDも変わらない。

interface Boundary {
  /** blocks のこのインデックスの直前で分割する */
  index: number
  /** 先頭からこの境界までの文字数 */
  chars: number
  /** 直後が「## 」見出し＝節の切れ目。CTAを置くのに最も自然な位置 */
  isSectionStart: boolean
}

/** 見出しは次の本文と切り離さない。リスト・引用・表の途中にも差し込まない。 */
function isHeading(block: string): boolean {
  return /^#{1,6}\s/.test(block)
}

function isContinuationBlock(block: string): boolean {
  return /^\s*([-*+]\s|\d+[.)]\s|>|\||:)/.test(block)
}

function countFences(block: string): number {
  return (block.match(/^```/gm) || []).length
}

function collectBoundaries(blocks: string[]): Boundary[] {
  const boundaries: Boundary[] = []
  let chars = blocks[0]?.length ?? 0
  let openFences = countFences(blocks[0] ?? "") % 2

  for (let index = 1; index < blocks.length; index++) {
    const previous = blocks[index - 1]
    const current = blocks[index]

    const insideCodeBlock = openFences % 2 !== 0
    if (!insideCodeBlock && !isHeading(previous) && !isContinuationBlock(current)) {
      boundaries.push({ index, chars, isSectionStart: /^##\s/.test(current) })
    }

    chars += current.length
    openFences += countFences(current)
  }

  return boundaries
}

/**
 * 節の切れ目（## 見出しの直前）を優先して選ぶ許容幅。
 * 全体の12%以内に節の切れ目があれば、多少ずれてもそちらを使う。
 */
const SECTION_SNAP_RATIO = 0.12

function pickBoundary(
  candidates: Boundary[],
  targetChars: number,
  totalChars: number,
): Boundary | undefined {
  if (candidates.length === 0) return undefined

  const tolerance = totalChars * SECTION_SNAP_RATIO
  const distance = (boundary: Boundary) => Math.abs(boundary.chars - targetChars)

  const nearestSection = candidates
    .filter((boundary) => boundary.isSectionStart && distance(boundary) <= tolerance)
    .sort((a, b) => distance(a) - distance(b))[0]

  if (nearestSection) return nearestSection

  return [...candidates].sort((a, b) => distance(a) - distance(b))[0]
}

/**
 * ratios（0〜1、昇順）の位置で本文を分割し、ratios.length + 1 個のセグメントを返す。
 * 分割できる境界が足りない短い記事では、返る数が減る（呼び出し側は存在するぶんだけ描画する）。
 */
export function splitArticleContent(content: string, ratios: number[]): string[] {
  const blocks = content.split(/\n{2,}/).filter((block) => block.trim().length > 0)
  if (blocks.length < 2) return [content]

  const totalChars = blocks.reduce((sum, block) => sum + block.length, 0)
  const allBoundaries = collectBoundaries(blocks)

  const chosen: Boundary[] = []
  for (const ratio of ratios) {
    const remaining = allBoundaries.filter(
      (boundary) => boundary.index > (chosen[chosen.length - 1]?.index ?? 0),
    )
    const boundary = pickBoundary(remaining, totalChars * ratio, totalChars)
    if (boundary) chosen.push(boundary)
  }

  const segments: string[] = []
  let start = 0
  for (const boundary of chosen) {
    segments.push(blocks.slice(start, boundary.index).join("\n\n"))
    start = boundary.index
  }
  segments.push(blocks.slice(start).join("\n\n"))

  return segments.filter((segment) => segment.length > 0)
}
