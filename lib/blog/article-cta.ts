// 記事内予約導線（CTA）の共通定義。
//
// 目的は「予約ボタンを増やす」ことではなく、記事で解消した疑問の延長として
// 適切なプランへ渡すこと。だから記事ごとに文言・誘導先・UTMキャンペーンを変える。
//
// 新しい記事へ展開する手順:
//   1. ARTICLE_CTA_CONFIGS へ記事スラッグ（またはページパス）をキーに定義を足す
//   2. campaign はその記事固有の値にする（計測でCTA元記事を判別するため）
//   3. 誘導先は lib/plan-details.ts に実在するプランID・実在するページパスだけを使う
//
// 定義がない記事では CTA は一切描画されない（全記事へ一括で同じCTAを出さない）。

import { PLAN_DETAILS } from "@/lib/plan-details"
import { getPlanPriceDisplay } from "@/lib/plan-price-display"

export const LINE_CONSULT_URL = "https://lin.ee/jfp4laz"

/** CTAの設置位置。計測の location プロパティにそのまま入る。 */
export type CtaPosition =
  | "article_top"
  | "article_middle"
  | "article_bottom"
  | "sticky_mobile"
  | "related_content"

/** CTAの種類。計測の ctaType プロパティにそのまま入る。 */
export type CtaType = "booking" | "plan_detail" | "line" | "private_tour" | "set_plan"

export interface ArticleCtaAction {
  label: string
  /** 内部パス（"/" 始まり）か外部URL。外部は external: true を付ける。 */
  href: string
  type: CtaType
  /** 誘導先プラン。計測の plan プロパティに入る。 */
  planId?: string
  external?: boolean
}

/** 記事本文中に差し込むカード。位置ごとに役割を変える。 */
export interface ArticleCtaCardConfig {
  position: Extract<CtaPosition, "article_top" | "article_middle" | "article_bottom">
  eyebrow: string
  title: string
  description: string
  /** 箇条書きの特徴。3件程度に抑える。 */
  features?: string[]
  /** 価格の表示行。省略時は planId から自動生成する。 */
  priceNote?: string
  /** 価格行の自動生成に使うプランID。 */
  pricePlanId?: string
  primary: ArticleCtaAction
  secondary?: ArticleCtaAction
  /**
   * soft: まだ情報収集中の読者向け。枠線だけの控えめな見た目。
   * strong: 検討が進んだ読者向け。塗りの見出し帯を付けて本文より目立たせる。
   */
  tone: "soft" | "strong"
}

export interface ArticleStickyCtaConfig {
  label: string
  href: string
  type: CtaType
  planId?: string
}

/** 「この記事を読んだ方におすすめ」の元データ。実在するプラン／記事だけを指す。 */
export type RelatedContentSource =
  | { kind: "plan"; planId: string; description: string }
  | { kind: "post"; slug: string; description: string }

/** 解決済みの関連コンテンツ（サーバー側で resolveRelatedContent を通したもの）。 */
export interface RelatedContentItem {
  title: string
  description: string
  href: string
  image: string
}

export interface ArticleCtaConfig {
  /** utm_campaign。記事ごとに必ず変える。 */
  campaign: string
  cards: ArticleCtaCardConfig[]
  sticky: ArticleStickyCtaConfig
  related: RelatedContentSource[]
}

// ============================================================
// UTM
// ============================================================

const INTERNAL_UTM = {
  utm_source: "blog",
  utm_medium: "article_cta",
} as const

export interface CtaUtm {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
}

export function buildCtaUtm(campaign: string, position: CtaPosition): CtaUtm {
  return { ...INTERNAL_UTM, utm_campaign: campaign, utm_content: position }
}

/**
 * 内部リンクへUTMを付ける。既存のクエリ（?plan=S1 など）は保持する。
 * 外部リンク（LINE）には付けない — 相手側に渡しても計測できないため。
 */
export function withCtaUtm(href: string, campaign: string, position: CtaPosition): string {
  if (!href.startsWith("/")) return href

  const [pathAndQuery, hash] = href.split("#")
  const [path, query] = pathAndQuery.split("?")
  const params = new URLSearchParams(query || "")

  for (const [key, value] of Object.entries(buildCtaUtm(campaign, position))) {
    params.set(key, value)
  }

  return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`
}

// ============================================================
// 価格表示
// ============================================================

/** カードに出す価格行。「大人¥6,500 / 子供¥6,000」のような1行にまとめる。 */
export function getCtaPriceNote(card: ArticleCtaCardConfig): string | undefined {
  if (card.priceNote) return card.priceNote

  const planId = card.pricePlanId ?? card.primary.planId
  if (!planId) return undefined

  return getPlanPriceDisplay(planId)?.compact
}

// ============================================================
// 関連コンテンツの解決
// ============================================================

/**
 * 関連コンテンツをタイトル・画像込みに解決する。
 * 記事タイトルや画像をこのファイルへ直書きしないことで、記事側を直しても表示がズレない。
 * getPost は fs を読む getBlogPost を想定しているためサーバー側から呼ぶこと。
 */
export function resolveRelatedContent(
  sources: RelatedContentSource[],
  getPost: (slug: string) => { title: string; image: string } | undefined,
): RelatedContentItem[] {
  return sources.reduce<RelatedContentItem[]>((items, source) => {
    if (source.kind === "plan") {
      const plan = PLAN_DETAILS[source.planId]
      if (!plan) return items

      items.push({
        title: plan.name,
        description: source.description,
        href: `/plans/${plan.id}`,
        image: plan.image,
      })
      return items
    }

    const post = getPost(source.slug)
    if (!post) return items

    items.push({
      title: post.title,
      description: source.description,
      href: `/blog/${source.slug}`,
      image: post.image,
    })
    return items
  }, [])
}

// ============================================================
// 記事別の定義
// ============================================================

const ARAGUSU_BEACH_CTA: ArticleCtaConfig = {
  campaign: "aragusu_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "新城海岸でウミガメを見たい方へ",
      title: "ウミガメが見やすい場所は、その日の海況で変わります",
      description:
        "風向き・潮位・混雑によって、安全に泳げる場所やウミガメを見つけやすい場所は日ごとに変わります。海亀兄弟では当日の海況を確認してから開催ポイントを決めています。",
      primary: {
        label: "新城海岸周辺でウミガメツアーを探す",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "当日の海況をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "個人で行くか迷っている方へ",
      title: "当日の海況に合った場所でウミガメと泳ぐ",
      description:
        "ポイント選びと安全管理はガイドが担当します。シュノーケル器材とライフジャケットは料金に含まれ、5歳から参加できます。",
      features: [
        "少人数制・ガイドがそばでサポート",
        "器材・ライフジャケット込み",
        "写真・動画データは無料",
      ],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "ツアー内容を詳しく見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "新城海岸の記事を読んだ方へ",
      title: "海況に左右されずにウミガメと泳ぐなら",
      description:
        "その日いちばん条件の良いポイントへご案内します。人数や泳ぎの自信に合わせて、少人数制と1組貸切から選べます。",
      features: ["5歳から参加可能", "前日までキャンセル無料", "写真・動画データは無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "1組貸切でゆっくり参加する",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
    },
  ],
  sticky: {
    label: "ウミガメツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "少人数制でウミガメを探す一番人気のツアー。器材と写真データ込みです。",
    },
    {
      kind: "post",
      slug: "miyakojima-kids-snorkeling-age-guide",
      description: "子供は何歳から参加できるのか、年齢別の目安と持ち物をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-snorkeling-tour-vs-self-guide",
      description: "個人で行く場合とツアー参加の違いを、費用と安全面から比べています。",
    },
  ],
}

const SEA_TURTLE_PILLAR_CTA: ArticleCtaConfig = {
  campaign: "sea_turtle_pillar",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "ウミガメに会いたい方へ",
      title: "遭遇率が高いポイントは、季節と海況で変わります",
      description:
        "宮古島は一年を通してウミガメに会いやすい海域ですが、会いやすい場所はその日の風と潮で変わります。海亀兄弟はポイントを熟知したガイドが当日判断でご案内します。",
      primary: {
        label: "ウミガメシュノーケルの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "会えるか不安な点をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "泳ぎに自信がない方へ",
      title: "ライフジャケットを着けて、浮いたままウミガメを見る",
      description:
        "少人数制でガイドがそばに付くため、泳ぎが苦手な方や初めての方でも参加できます。水面に浮いた状態でウミガメを観察できます。",
      features: ["ライフジャケット着用で浮いたまま参加", "5歳から65歳まで参加可能", "写真・動画データは無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "1組貸切でゆっくり参加する",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "宮古島でウミガメと泳ぐなら",
      title: "その日の海況に合わせて、会いやすい場所へ",
      description:
        "ウミガメシュノーケル単体のほか、同じビーチでドローンSUPまで続けて楽しめる海空セットもあります。",
      features: ["少人数制・ガイドがそばでサポート", "器材・ライフジャケット込み", "前日までキャンセル無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "海空セット（SUP付き）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "ウミガメツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "少人数制でウミガメを探す一番人気のツアー。器材と写真データ込みです。",
    },
    {
      kind: "post",
      slug: "aragusu-beach-snorkeling-guide",
      description: "ウミガメが見られることもある新城海岸を、駐車場や海況の注意点まで解説。",
    },
    {
      kind: "post",
      slug: "miyakojima-beginner-snorkeling-guide",
      description: "初めてのシュノーケリングで押さえておきたい準備と流れをまとめています。",
    },
  ],
}

const KIDS_AGE_GUIDE_CTA: ArticleCtaConfig = {
  campaign: "kids_age_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "お子様と参加を検討中の方へ",
      title: "年齢だけで判断せず、当日の様子に合わせて進めます",
      description:
        "同じ年齢でも、水に慣れているかどうかで無理のない範囲は変わります。海亀兄弟ではお子様の様子を見ながら、途中で休みながらでも進められるようご案内しています。",
      primary: {
        label: "子供と一緒に参加できるプランを見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "年齢についてLINEで相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "ご家族での参加を考えている方へ",
      title: "貸切なら、お子様のペースだけで進められます",
      description:
        "他のお客様を気にせず、休憩をはさみながら進められます。人数が少ないご家族でも1組貸切で参加できます。",
      features: ["専属ガイドが1組に付きっきり", "子供用の器材も無料で用意", "写真・動画データは無料"],
      primary: {
        label: "貸切でゆっくり参加する",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
      secondary: {
        label: "通常の少人数制ツアーを見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "年齢の記事を読んだ方へ",
      title: "お子様の年齢に合わせてプランを選べます",
      description:
        "シュノーケルは5歳から。もっと小さいお子様とご一緒なら、0歳から参加できる夜のヤシガニ探検という選び方もあります。",
      features: ["シュノーケルは5歳から", "ナイトツアーは0歳から・3歳以下無料", "前日までキャンセル無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "0歳から参加できるナイトツアーを見る",
        href: "/plans/S3",
        type: "plan_detail",
        planId: "S3",
      },
    },
  ],
  sticky: {
    label: "子供と参加できる空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S2",
      description: "1組貸切だから、お子様のペースに合わせて休みながら進められます。",
    },
    {
      kind: "plan",
      planId: "S3",
      description: "0歳から参加できる夜の探検ツアー。3歳以下は無料です。",
    },
    {
      kind: "post",
      slug: "aragusu-beach-snorkeling-guide",
      description: "子連れでも入りやすい新城海岸の設備と、注意したい海況をまとめています。",
    },
  ],
}

/**
 * キーは記事スラッグ（ブログ）またはページパス（ピラーページ）。
 * ここに無いページではCTAを描画しない。
 */
export const ARTICLE_CTA_CONFIGS: Record<string, ArticleCtaConfig> = {
  "aragusu-beach-snorkeling-guide": ARAGUSU_BEACH_CTA,
  "miyakojima-kids-snorkeling-age-guide": KIDS_AGE_GUIDE_CTA,
  "/miyakojima-sea-turtle": SEA_TURTLE_PILLAR_CTA,
}

export function getArticleCtaConfig(key: string): ArticleCtaConfig | undefined {
  return ARTICLE_CTA_CONFIGS[key]
}

export function getArticleCtaCard(
  config: ArticleCtaConfig,
  position: ArticleCtaCardConfig["position"],
): ArticleCtaCardConfig | undefined {
  return config.cards.find((card) => card.position === position)
}
