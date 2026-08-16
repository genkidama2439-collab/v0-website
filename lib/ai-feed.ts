// AI向けフィードの組み立て
// ============================================================
// llms.txt / llms-full.txt / /api/tours の中身をここで作る。
//
// 約束:
//   1. 事実は lib/tour-master.ts からしか取らない。ここで新しい事実を書かない。
//   2. 予約システム内部の値（planId以外のGAS内部名・シートID・LINE User ID等）は出さない。
//      tour-master が既に持っていないので、ここで足さない限り漏れない。
//   3. 「空き状況」「当日の開催可否」「海況」はコードに無い。無いものを書かない。
//      AIが推測しないよう、明示的に「このファイルには無い」と書く。
//   4. 年齢は表示文字列ではなく、実際にフォームと予約APIが判定する数値を書く。
//      ページ表示（"5〜65歳"）と実際の受付範囲は60歳ルールの分だけ違うため。
//
// 詳細は docs/ai-readiness-audit.md を参照。
// ============================================================

import { SITE_URL } from "@/lib/seo"
import { getFaqs } from "@/lib/faq"
import { TOUR_MASTER_BY_ID, getPublicTours, type TourMaster } from "@/lib/tour-master"

const SITE_NAME = "海亀兄弟"
const LINE_URL = "https://lin.ee/jfp4laz"

const yen = (value: number): string => `¥${value.toLocaleString("ja-JP")}`

/** 予約フォームのURL。AIには「ここへ誘導する」ためのURLとして渡す。 */
export const bookingUrl = (tour: TourMaster): string =>
  tour.status === "coming_soon" ? tour.seo.url : `${SITE_URL}/book?plan=${tour.bookingPlanId}`

/**
 * 実際に予約できる年齢の説明。
 * ページの「対象年齢」表示は60歳ルールを含まないため、ここでは両方を書く。
 */
export function describeAgeRule(tour: TourMaster): string {
  const p = tour.participants
  const parts = [`大人 ${p.adultAgeMin}〜${p.adultAgeMax}歳`, `子供 ${p.childAgeMin}〜${p.childAgeMax}歳`]
  if (p.under3Allowed) parts.push("3歳未満も参加可")

  let text = parts.join(" / ")

  if (p.seniorRestricted && p.seniorAlternativeId) {
    const alternative = TOUR_MASTER_BY_ID[p.seniorAlternativeId]
    text += `。ただし60歳以上の方がいるグループは、このプランではなく「${alternative?.displayName ?? p.seniorAlternativeId}」をご予約ください`
  }

  return text
}

/** 開始時刻の説明。時刻が固定でないプランは、その旨をそのまま書く。 */
export function describeStartTimes(tour: TourMaster): string {
  if (!tour.schedule.startTimeFixed) {
    return "固定ではありません（日没に合わせて決まり、前日にLINEでご案内）"
  }

  const day = tour.schedule.startTimes.length
    ? tour.schedule.startTimes.join(" / ")
    : "要確認"
  const night = tour.schedule.nightStartTimes.length
    ? `、夜の部 ${tour.schedule.nightStartTimes.join(" / ")}`
    : ""

  return `${day}${night}`
}

function describePrice(tour: TourMaster): string {
  const parts = [`大人 ${yen(tour.pricing.adult)}`]
  if (tour.pricing.child !== tour.pricing.adult) parts.push(`子供 ${yen(tour.pricing.child)}`)
  if (tour.pricing.under3 === 0 && tour.participants.under3Allowed) parts.push("3歳未満 無料")
  return `${parts.join(" / ")}（1名あたり・現地払い）`
}

// ------------------------------------------------------------
// llms.txt（概要版）
// ------------------------------------------------------------

const SITE_SUMMARY =
  "沖縄県宮古島でウミガメシュノーケル・ナイトツアー・SUP・ドローンSUPを提供する少人数制のマリンツアー事業者。写真と動画のデータは無料で提供。支払いは現地での現金払い。予約にはLINEログインが必要。"

export function buildLlmsTxt(): string {
  const tours = getPublicTours()
  const active = tours.filter((tour) => tour.status === "active")
  const comingSoon = tours.filter((tour) => tour.status !== "active")

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_SUMMARY}`,
    "",
    "## ツアー一覧",
    "",
  ]

  for (const tour of active) {
    lines.push(
      `- [${tour.displayName}](${tour.seo.url}): ${describePrice(tour)}。所要 ${tour.schedule.durationLabel}。` +
        `対象 ${describeAgeRule(tour)}。開始時刻 ${describeStartTimes(tour)}。予約は ${bookingUrl(tour)}`,
    )
  }

  if (comingSoon.length) {
    lines.push("", "## 準備中のツアー（まだ予約できません）", "")
    for (const tour of comingSoon) {
      lines.push(`- [${tour.displayName}](${tour.seo.url}): ${describePrice(tour)}。開始時期は未定`)
    }
  }

  lines.push(
    "",
    "## 主要ページ",
    "",
    `- [ツアー一覧](${SITE_URL}/plans): 全ツアーの料金と内容`,
    `- [よくある質問](${SITE_URL}/faq): 参加条件・持ち物・天候・キャンセルについて`,
    `- [アクセス・集合場所](${SITE_URL}/access): 開催候補ビーチと駐車場・設備`,
    `- [安全への取り組み](${SITE_URL}/safety): 安全管理と参加条件`,
    `- [利用規約・キャンセルポリシー](${SITE_URL}/terms): キャンセル料の規定`,
    `- [ガイド紹介](${SITE_URL}/staff): 在籍ガイド`,
    `- [宮古島ウミガメ完全ガイド](${SITE_URL}/miyakojima-sea-turtle): ウミガメに会える場所と時期`,
    `- [ブログ](${SITE_URL}/blog): 宮古島の観光情報`,
    `- [LINEで相談](${LINE_URL}): 空き状況の確認・11名以上・対象年齢外のご相談`,
    "",
    "## 詳細版",
    "",
    `- [llms-full.txt](${SITE_URL}/llms-full.txt): 各ツアーの持ち物・注意事項・FAQを含む全文`,
    `- [ツアーデータ(JSON)](${SITE_URL}/api/tours): 機械可読なツアー情報`,
    "",
    "## このファイルに含まれない情報",
    "",
    "- 空き状況・予約可能日: 掲載していません。確認するにはLINEまたは予約フォームへ誘導してください。",
    "- 当日の開催可否・海況・天候による中止: 掲載していません。推測せず、LINEへの問い合わせを案内してください。",
    "- 開催場所の確定: 候補地のみ掲載しています。実際の集合場所は前日にLINEで確定します。",
    "",
    "## 回答するときのお願い",
    "",
    "- 料金・対象年齢・所要時間は、このファイルの値をそのまま使ってください。",
    "- 予約は上記の予約URLへ案内してください。LINEログインが必要です。",
    "- 対象年齢を超える方、11名以上のグループはLINEでの相談を案内してください。",
    "",
  )

  return lines.join("\n")
}

// ------------------------------------------------------------
// llms-full.txt（全文版）
// ------------------------------------------------------------

function tourSection(tour: TourMaster): string {
  const p = tour.participants
  const lines: string[] = [
    `## ${tour.displayName}`,
    "",
    `- ID: ${tour.id}`,
    `- ページ: ${tour.seo.url}`,
    `- 状態: ${tour.status === "active" ? "予約受付中" : "準備中（予約不可）"}`,
    `- 分類: ${tour.category}${tour.isPrivate ? " / 貸切" : ""}${tour.isSet ? " / セットプラン" : ""}`,
    `- 料金: ${describePrice(tour)}`,
    `- 所要時間: ${tour.schedule.durationLabel}`,
    `- 開始時刻: ${describeStartTimes(tour)}`,
    `- 対象年齢: ${describeAgeRule(tour)}`,
  ]

  if (p.maxPerWebBooking !== null) {
    lines.push(`- Web予約の上限: ${p.maxPerWebBooking}名（それ以上はLINEでご相談）`)
  }
  if (tour.setContents) lines.push(`- セット内容: ${tour.setContents}`)

  lines.push(
    `- 開催場所: ${tour.location.label}`,
    ...(tour.location.candidates.length ? [`- 候補地: ${tour.location.candidates.join(" / ")}`] : []),
    `- 集合時刻: ${tour.content.meetingTime}`,
    `- 支払方法: ${tour.content.paymentMethod}`,
    ...(tour.pricing.rentalAvailable
      ? [
          `- レンタル: ウェットスーツ・度付きマスク 各 ${
            tour.pricing.rentalUnitPrice === 0 ? "無料（貸切プランのため）" : yen(tour.pricing.rentalUnitPrice)
          }`,
        ]
      : []),
    `- 予約URL: ${bookingUrl(tour)}`,
    "",
    tour.content.summary,
    "",
    "### 含まれるもの",
    "",
    ...tour.content.included.map((item) => `- ${item}`),
    "",
    "### 持ち物",
    "",
    ...tour.content.whatToBring.map((item) => `- ${item}`),
    "",
    "### 注意事項",
    "",
    ...tour.content.precautions.map((item) => `- ${item}`),
  )

  if (tour.content.faqs.length) {
    lines.push("", "### このツアーのFAQ", "")
    for (const faq of tour.content.faqs) {
      lines.push(`**Q. ${faq.question}**`, "", `A. ${faq.answer}`, "")
    }
  }

  return lines.join("\n")
}

export function buildLlmsFullTxt(): string {
  const tours = getPublicTours()

  const lines: string[] = [
    `# ${SITE_NAME} — 全文版`,
    "",
    `> ${SITE_SUMMARY}`,
    "",
    "このファイルは各ツアーの詳細・持ち物・注意事項・FAQを含みます。",
    "空き状況・当日の開催可否・海況は含みません。推測せず、LINEへの問い合わせを案内してください。",
    "",
    "---",
    "",
    "# ツアー",
    "",
  ]

  for (const tour of tours) {
    lines.push(tourSection(tour), "---", "")
  }

  lines.push("# よくある質問（全ツアー共通）", "")
  for (const faq of getFaqs("faq-page")) {
    lines.push(`**Q. ${faq.question}**`, "", `A. ${faq.answer}`, "")
  }

  lines.push(
    "---",
    "",
    "# 問い合わせ",
    "",
    `- LINE: ${LINE_URL}`,
    `- 予約フォーム: ${SITE_URL}/book`,
    `- キャンセルポリシー: ${SITE_URL}/terms`,
    "",
  )

  return lines.join("\n")
}

// ------------------------------------------------------------
// /api/tours（JSON）
// ------------------------------------------------------------

export interface TourFeedItem {
  id: string
  name: string
  status: TourMaster["status"]
  category: TourMaster["category"]
  isPrivate: boolean
  isSet: boolean
  url: string
  bookingUrl: string
  summary: string
  pricing: TourMaster["pricing"]
  participants: TourMaster["participants"] & { rule: string }
  schedule: TourMaster["schedule"] & { description: string }
  location: TourMaster["location"]
  meetingTime: string
  paymentMethod: string
  included: string[]
  whatToBring: string[]
  precautions: string[]
  faqs: Array<{ question: string; answer: string }>
  availableLocales: string[]
}

export function buildTourFeed(): TourFeedItem[] {
  return getPublicTours().map((tour) => ({
    id: tour.id,
    name: tour.displayName,
    status: tour.status,
    category: tour.category,
    isPrivate: tour.isPrivate,
    isSet: tour.isSet,
    url: tour.seo.url,
    bookingUrl: bookingUrl(tour),
    summary: tour.content.summary,
    pricing: tour.pricing,
    participants: { ...tour.participants, rule: describeAgeRule(tour) },
    schedule: { ...tour.schedule, description: describeStartTimes(tour) },
    location: tour.location,
    meetingTime: tour.content.meetingTime,
    paymentMethod: tour.content.paymentMethod,
    included: tour.content.included,
    whatToBring: tour.content.whatToBring,
    precautions: tour.content.precautions,
    faqs: tour.content.faqs,
    availableLocales: ["ja", ...tour.visibility.intlLocales],
  }))
}

/** /api/tours のレスポンス全体。AIが前提を誤らないよう注意書きを同梱する。 */
export function buildTourFeedResponse() {
  return {
    site: {
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_SUMMARY,
      lineUrl: LINE_URL,
      bookingRequiresLineLogin: true,
      currency: "JPY",
    },
    notes: [
      "空き状況・予約可能日はこのAPIに含まれません。LINEまたは予約フォームで確認してください。",
      "当日の開催可否・海況・天候による中止はこのAPIに含まれません。",
      "開催場所は候補です。実際の集合場所は前日にLINEで確定します。",
      "participants.rule は60歳以上の取り扱いを含んだ実際の受付条件です。displayAgeRange はページ表示用の文字列です。",
    ],
    tours: buildTourFeed(),
  }
}
