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

const BEGINNER_GUIDE_CTA: ArticleCtaConfig = {
  campaign: "beginner_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "初めてのシュノーケルで不安な方へ",
      title: "泳げなくても、浮いたまま海の中を見られます",
      description:
        "ライフジャケットを着けるので、水に顔をつけられれば参加できます。少人数制でガイドがそばに付くため、初めての方が最初にやることから順番に案内します。",
      primary: {
        label: "初心者向けツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "泳げなくても参加できるか聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "持ち物を調べている方へ",
      title: "器材は全部込み。水着とタオルだけで参加できます",
      description:
        "シュノーケル・マスク・ライフジャケットはツアーに含まれます。サイズ合わせも当日ガイドが行うので、道具を買い揃える必要はありません。",
      features: ["器材・ライフジャケット込み", "少人数制・ガイドがそばでサポート", "写真・動画データは無料"],
      primary: {
        label: "少人数ツアーの空きを見る",
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
      eyebrow: "初心者ガイドを読んだ方へ",
      title: "初めてでも、その日の海況に合った場所から",
      description:
        "波が穏やかで入りやすい場所は日によって変わります。ポイント選びはガイドが担当するので、初めての方でも無理なく参加できます。",
      features: ["5歳から参加可能", "前日までキャンセル無料", "写真・動画データは無料"],
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
  ],
  sticky: {
    label: "初心者向けツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "器材・ライフジャケット込みの少人数制ツアー。初めての方が一番多く選びます。",
    },
    {
      kind: "post",
      slug: "miyakojima-snorkeling-tour-vs-self-guide",
      description: "個人で行く場合とツアー参加の違いを、安全面と費用から比べています。",
    },
    {
      kind: "post",
      slug: "aragusu-beach-snorkeling-guide",
      description: "初心者が行きやすい新城海岸の設備と、注意したい海況をまとめています。",
    },
  ],
}

const TOUR_VS_SELF_CTA: ArticleCtaConfig = {
  campaign: "tour_vs_self",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "個人かツアーか迷っている方へ",
      title: "判断が分かれるのは、その日の海況を読めるかどうかです",
      description:
        "同じビーチでも、風向き・波・潮の流れで安全に入れる場所は変わります。ガイド付きなら当日の条件を見てポイントを選べるため、条件が悪い日ほど差が出ます。",
      primary: {
        label: "ガイド付きツアーの内容を見る",
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
      eyebrow: "ウミガメに会いたい方へ",
      title: "ポイント選びと安全管理をガイドに任せる",
      description:
        "ウミガメが見られる可能性のある場所を、その日の海況と合わせて判断します。器材・ライフジャケット込みで、5歳から参加できます。",
      features: ["少人数制・ガイドがそばでサポート", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "比較記事を読んだ方へ",
      title: "海の中も、海の上も楽しみたいなら",
      description:
        "シュノーケル単体のほか、同じビーチでドローンSUPまで続けて楽しめる海空セットもあります。迷っている方はセットで両方を試せます。",
      features: ["前日までキャンセル無料", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
    label: "ガイド付きツアーの空きを見る",
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
      slug: "miyakojima-beginner-snorkeling-guide",
      description: "初めてのシュノーケリングで押さえておきたい準備と流れをまとめています。",
    },
    {
      kind: "post",
      slug: "aragusu-beach-snorkeling-guide",
      description: "個人で行くなら知っておきたい新城海岸の駐車場・設備・海況の注意点。",
    },
  ],
}

const NIGHT_TOUR_CTA: ArticleCtaConfig = {
  campaign: "night_tour_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "ヤシガニに会いたい方へ",
      title: "ヤシガニがいる場所は、季節と天候で変わります",
      description:
        "夜行性のヤシガニは、気温や雨のあとで出やすさが変わります。海亀兄弟ではジャングルに詳しいガイドが、その日に見つけやすい場所へ案内します。",
      primary: {
        label: "ヤシガニ探検ツアーを見る",
        href: "/plans/S3",
        type: "plan_detail",
        planId: "S3",
      },
      secondary: {
        label: "開始時間や持ち物をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "小さなお子様と参加したい方へ",
      title: "0歳から参加でき、3歳以下は無料です",
      description:
        "歩く距離は短く、途中で休みながら進められます。抱っこやベビーカーのご家族も参加されていて、三世代でのご参加も歓迎です。",
      features: ["0歳〜75歳まで参加可能", "専用懐中電灯の貸出あり", "探検中の写真データは無料"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "1組貸切でゆっくり探検する",
        href: "/plans/S5",
        type: "private_tour",
        planId: "S5",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "ナイトツアーの記事を読んだ方へ",
      title: "昼の海とまとめると1,000円お得になります",
      description:
        "昼はウミガメシュノーケル、夜はヤシガニ探検。1日で宮古島の昼と夜を両方楽しめる昼夜セットが人気です。",
      features: ["昼夜セットは単品より1,000円お得", "3歳以下無料", "前日までキャンセル無料"],
      priceNote: "ナイトツアー単品 一律¥4,000・3歳以下無料",
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "ナイトツアーの空きを見る",
    href: "/book?plan=S3",
    type: "booking",
    planId: "S3",
  },
  related: [
    {
      kind: "plan",
      planId: "S3",
      description: "0歳から参加できる夜のジャングル探検。一律4,000円・3歳以下無料です。",
    },
    {
      kind: "plan",
      planId: "C1",
      description: "昼はウミガメ、夜はヤシガニ。単品で申し込むより1,000円お得なセットです。",
    },
    {
      kind: "post",
      slug: "miyakojima-kids-snorkeling-age-guide",
      description: "昼のシュノーケルは何歳から参加できるか、年齢別の目安をまとめています。",
    },
  ],
}

// ---- アクティビティに直結する記事 ----------------------------------------

const OUTFIT_PACKING_CTA: ArticleCtaConfig = {
  campaign: "outfit_packing",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "持ち物を調べている方へ",
      title: "ツアー参加なら、用意するのは水着とタオルだけです",
      description:
        "シュノーケル・マスク・ライフジャケットはツアーに含まれます。サイズ合わせは当日ガイドが行うので、道具を買い揃える必要はありません。",
      primary: {
        label: "ツアーに含まれる器材を確認する",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "持ち物で迷う点をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "寒さ・日焼けが心配な方へ",
      title: "ウェットスーツと度付きマスクは無料で貸し出しています",
      description:
        "水温が下がる時期はウェットスーツ、コンタクトが苦手な方は度付きマスクを予約時に選べます。当日の追加料金はかかりません。",
      features: [
        "ウェットスーツ・度付きマスクの貸出あり",
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
      eyebrow: "持ち物リストを読み終えた方へ",
      title: "準備が決まったら、あとは日程を押さえるだけ",
      description:
        "少人数制のため、希望の時間帯は早めに埋まります。前日までのキャンセルは無料なので、日程だけ先に押さえておく方も多いです。",
      features: ["5歳から参加可能", "前日までキャンセル無料", "所要は約2時間"],
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
      description: "器材・ライフジャケット込みの少人数制ツアー。水着とタオルだけで参加できます。",
    },
    {
      kind: "post",
      slug: "miyakojima-beginner-snorkeling-guide",
      description: "初めてのシュノーケリングで押さえておきたい準備と当日の流れをまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-kids-snorkeling-age-guide",
      description: "子供は何歳から参加できるのか、年齢別の目安と持ち物をまとめています。",
    },
  ],
}

const DRONE_SUP_CTA: ArticleCtaConfig = {
  campaign: "drone_sup_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "ドローンSUPが気になる方へ",
      title: "空撮の写真は、ツアー料金に含まれています",
      description:
        "SUPで海に出ている間に、ガイドが上空からドローンで撮影します。撮影データは後日無料でお渡しするため、別途の撮影料はかかりません。",
      primary: {
        label: "ドローンSUP体験の詳細を見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
      secondary: {
        label: "撮影の内容をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "SUPが初めての方へ",
      title: "立てなくても大丈夫。座ったままでも撮れます",
      description:
        "最初は座った状態から始めて、慣れてきたら立つ流れです。バランスに自信がなくても、上空からの写真はきれいに残ります。",
      features: ["ドローン撮影付き", "5歳から参加可能", "所要は約2時間"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "1組貸切のドローンSUPを見る",
        href: "/plans/S7",
        type: "private_tour",
        planId: "S7",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "ドローンSUPの記事を読んだ方へ",
      title: "海の中の写真もまとめて残すなら",
      description:
        "同じ日にウミガメシュノーケルとドローンSUPを続けて楽しめる海空セットなら、水中とドローンの両方の写真が残せます。",
      features: ["海空セットは単品より1,000円お得", "水中写真とドローン写真の両方", "前日までキャンセル無料"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "ドローンSUPの空きを見る",
    href: "/book?plan=S6",
    type: "booking",
    planId: "S6",
  },
  related: [
    {
      kind: "plan",
      planId: "S6",
      description: "SUPを楽しみながら上空から撮影。写真データは無料でお渡しします。",
    },
    {
      kind: "plan",
      planId: "C3",
      description: "ウミガメシュノーケルとドローンSUPを1日で。単品より1,000円お得です。",
    },
    {
      kind: "post",
      slug: "miyakojima-photo-spot-instagram-guide",
      description: "陸から撮れる絶景スポットを20か所紹介。空撮と組み合わせると幅が広がります。",
    },
  ],
}

const SUP_BEGINNER_CTA: ArticleCtaConfig = {
  campaign: "sup_beginner_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "SUPが初めての方へ",
      title: "最初は座ったまま。立つのは慣れてからで大丈夫です",
      description:
        "ボードの上に座ってパドルを漕ぐところから始めます。運動が苦手な方でも、無理に立たずに海の上を移動できます。",
      primary: {
        label: "サンセットSUPの詳細を見る",
        href: "/plans/S8",
        type: "plan_detail",
        planId: "S8",
      },
      secondary: {
        label: "体力面の不安をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "夕方の時間帯を選びたい方へ",
      title: "夕日の時間に合わせて海に出ます",
      description:
        "その日の日没時刻に合わせて開始します。空の色が変わっていく時間帯を海の上から眺められ、ドローン撮影も付いています。",
      features: ["ドローン撮影付き", "5歳から参加可能", "所要は約2時間"],
      primary: {
        label: "サンセットSUPの空きを見る",
        href: "/book?plan=S8",
        type: "booking",
        planId: "S8",
      },
      secondary: {
        label: "日中のドローンSUPを見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "SUPガイドを読んだ方へ",
      title: "二人だけ・家族だけで海に出るなら",
      description:
        "他のお客様と一緒にならない1組貸切なら、写真を撮る時間もゆっくり取れます。記念日のご利用も多いプランです。",
      features: ["1組貸切・ドローン撮影付き", "前日までキャンセル無料", "所要は約2時間"],
      primary: {
        label: "サンセットSUPの空きを見る",
        href: "/book?plan=S8",
        type: "booking",
        planId: "S8",
      },
      secondary: {
        label: "1組貸切のサンセットSUPを見る",
        href: "/plans/S4",
        type: "private_tour",
        planId: "S4",
      },
    },
  ],
  sticky: {
    label: "サンセットSUPの空きを見る",
    href: "/book?plan=S8",
    type: "booking",
    planId: "S8",
  },
  related: [
    {
      kind: "plan",
      planId: "S8",
      description: "夕日の時間に合わせて海に出るSUP。ドローン撮影が付いています。",
    },
    {
      kind: "plan",
      planId: "S6",
      description: "日中の透明度が高い時間帯に、上空から撮影するドローンSUPです。",
    },
    {
      kind: "post",
      slug: "miyakojima-drone-sup-guide",
      description: "ドローンSUPの内容・料金・当日の流れを、開催しているガイドが解説しています。",
    },
  ],
}

const PHOTO_SPOT_CTA: ArticleCtaConfig = {
  campaign: "photo_spot_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "写真を撮りに行く方へ",
      title: "陸から撮れない角度は、上空から撮れます",
      description:
        "紹介したスポットは陸からの撮影が中心です。海の上に出てドローンで撮ると、宮古ブルーの広がりがそのまま1枚に収まります。",
      primary: {
        label: "ドローン空撮付きのSUPを見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
      secondary: {
        label: "撮影できる時間帯をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "SNSに載せる写真を探している方へ",
      title: "ドローン撮影のデータは無料でお渡しします",
      description:
        "SUPで海に出ている間の空撮を、追加料金なしでお渡ししています。撮影のためにカメラを持ち込む必要はありません。",
      features: ["ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "1組貸切のドローンSUPを見る",
        href: "/plans/S7",
        type: "private_tour",
        planId: "S7",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "フォトスポットの記事を読んだ方へ",
      title: "夕景を狙うなら、海の上からという選択もあります",
      description:
        "日没の時間帯に合わせて出るサンセットSUPなら、空の色が変わる時間をそのまま撮影できます。水中写真が欲しい方はウミガメシュノーケルとの組み合わせもあります。",
      features: ["ドローン撮影付き", "前日までキャンセル無料", "5歳から参加可能"],
      primary: {
        label: "サンセットSUPの空きを見る",
        href: "/book?plan=S8",
        type: "booking",
        planId: "S8",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "空撮付きツアーの空きを見る",
    href: "/book?plan=S6",
    type: "booking",
    planId: "S6",
  },
  related: [
    {
      kind: "plan",
      planId: "S6",
      description: "SUPを楽しみながら上空から撮影。データは無料でお渡しします。",
    },
    {
      kind: "plan",
      planId: "S8",
      description: "夕日の時間に合わせて海へ。空の色が変わる時間帯を空撮で残せます。",
    },
    {
      kind: "post",
      slug: "miyakojima-drone-sup-guide",
      description: "ドローンSUPの内容・料金・当日の流れをまとめています。",
    },
  ],
}

const CORAL_REEF_CTA: ArticleCtaConfig = {
  campaign: "coral_conservation",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "サンゴを見に行く方へ",
      title: "サンゴを傷つけない泳ぎ方は、当日ガイドがお伝えします",
      description:
        "立たない・触れない・日焼け止めを選ぶ。この3点を守るだけで負担は大きく変わります。ツアーでは入水前に毎回ご説明しています。",
      primary: {
        label: "ガイド付きシュノーケルを見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "海の状態をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "初めてサンゴ礁で泳ぐ方へ",
      title: "ライフジャケットを着ければ、立たずに観察できます",
      description:
        "浮いた状態を保てるので、足を着いてサンゴを踏んでしまう心配がありません。少人数制でガイドがそばに付きます。",
      features: ["少人数制・ガイドがそばでサポート", "器材・ライフジャケット込み", "写真・動画データは無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "1組貸切でゆっくり観察する",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "保全の記事を読んだ方へ",
      title: "実際の海を見てから、できることを考える",
      description:
        "写真や記事で読むより、実際に海に入って見たほうが伝わることがあります。その日いちばん状態の良いポイントへご案内します。",
      features: ["5歳から参加可能", "前日までキャンセル無料", "所要は約2時間"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "上空から海を見るドローンSUP",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
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
      description: "少人数制でウミガメを探すツアー。入水前にサンゴへの配慮をご説明します。",
    },
    {
      kind: "post",
      slug: "aragusu-beach-snorkeling-guide",
      description: "新城海岸の設備と、海況によって変わる注意点をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-beginner-snorkeling-guide",
      description: "初めてのシュノーケリングで押さえておきたい準備と流れをまとめています。",
    },
  ],
}

// ---- 旅程・エリアの記事 --------------------------------------------------

const RAINY_DAY_CTA: ArticleCtaConfig = {
  campaign: "rainy_day_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "雨予報で予定を悩んでいる方へ",
      title: "雨のあとは、ヤシガニが出てきやすくなります",
      description:
        "夜行性の生き物は、気温や雨のあとの湿り気で出やすさが変わります。晴れを待つより、夜のジャングル探検に切り替えたほうが当たる日もあります。",
      primary: {
        label: "夜のヤシガニ探検を見る",
        href: "/plans/S3",
        type: "plan_detail",
        planId: "S3",
      },
      secondary: {
        label: "当日の天候をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "室内以外の選択肢を探している方へ",
      title: "0歳から参加でき、3歳以下は無料です",
      description:
        "歩く距離は短く、途中で休みながら進められます。所要は約1.5時間なので、夕食の前に組み込めます。",
      features: ["0歳〜75歳まで参加可能", "専用懐中電灯の貸出あり", "所要は約1.5時間"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "1組貸切でゆっくり探検する",
        href: "/plans/S5",
        type: "private_tour",
        planId: "S5",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "雨の日ガイドを読んだ方へ",
      title: "晴れ間が出たら、海の予定も押さえておく",
      description:
        "宮古島の天気は半日で変わります。前日までのキャンセルは無料なので、海のツアーも仮に押さえておくと動きやすくなります。",
      features: ["前日までキャンセル無料", "昼夜セットは単品より1,000円お得", "5歳から参加可能"],
      primary: {
        label: "ウミガメツアーの空きを見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "ナイトツアーの空きを見る",
    href: "/book?plan=S3",
    type: "booking",
    planId: "S3",
  },
  related: [
    {
      kind: "plan",
      planId: "S3",
      description: "0歳から参加できる夜のジャングル探検。一律4,000円・3歳以下無料です。",
    },
    {
      kind: "post",
      slug: "miyakojima-night-tour-yashigani-guide",
      description: "ヤシガニが見つかりやすい条件と、当日の持ち物をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-june-travel-guide-2026",
      description: "梅雨明けの目安や台風・高波の注意点を、現地ガイド目線で整理しています。",
    },
  ],
}

const SEVENTEEN_END_CTA: ArticleCtaConfig = {
  campaign: "17end_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "17ENDへ行く予定の方へ",
      title: "干潮の時間まで、海の上で過ごすという選び方",
      description:
        "17ENDの砂浜が現れるのは干潮の前後だけです。待ち時間が空くなら、その間にSUPやシュノーケルを入れると一日を無駄なく使えます。",
      primary: {
        label: "ドローン空撮付きのSUPを見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
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
      eyebrow: "絶景を写真に残したい方へ",
      title: "海の上からの一枚は、上空からしか撮れません",
      description:
        "SUPで海に出ている間にドローンで撮影します。展望台や砂浜からの写真とは違う構図が残せて、データは無料でお渡しします。",
      features: ["ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "ツアー内容を詳しく見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "17ENDの記事を読んだ方へ",
      title: "海の中も見るなら、ウミガメシュノーケルも",
      description:
        "宮古島はウミガメに会いやすい海域です。景色を見る予定に、海の中に入る時間も足すと一日の密度が変わります。",
      features: ["少人数制・ガイドがそばでサポート", "器材・ライフジャケット込み", "写真・動画データは無料"],
      primary: {
        label: "ウミガメツアーの空きを見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "空撮付きツアーの空きを見る",
    href: "/book?plan=S6",
    type: "booking",
    planId: "S6",
  },
  related: [
    {
      kind: "plan",
      planId: "S6",
      description: "SUPで海に出て、上空から撮影。写真データは無料でお渡しします。",
    },
    {
      kind: "post",
      slug: "irabu-shimoji-lunch-cafe-2026",
      description: "17ENDの前後に寄りやすい、伊良部・下地エリアのランチとカフェをまとめています。",
    },
    {
      kind: "post",
      slug: "shimojishima-airport-2026-summer-schedule-access",
      description: "下地島空港の夏ダイヤとアクセス。17ENDへ向かう前に確認しておきたい情報です。",
    },
  ],
}

const SHIMOJISHIMA_AIRPORT_CTA: ArticleCtaConfig = {
  campaign: "shimojishima_airport",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "到着日の予定を組む方へ",
      title: "到着が夕方でも、その日のうちに動けます",
      description:
        "夜のヤシガニ探検は所要約1.5時間で、日没後の開催です。到着日は移動で埋まりがちですが、夜の時間なら初日から予定を入れられます。",
      primary: {
        label: "夜のヤシガニ探検を見る",
        href: "/plans/S3",
        type: "plan_detail",
        planId: "S3",
      },
      secondary: {
        label: "到着時刻に合うか相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "初日から動きたい方へ",
      title: "0歳から参加でき、3歳以下は無料です",
      description:
        "歩く距離は短く、小さなお子様連れでも参加できます。移動で疲れた初日でも負担になりにくい内容です。",
      features: ["0歳〜75歳まで参加可能", "専用懐中電灯の貸出あり", "所要は約1.5時間"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "1組貸切でゆっくり探検する",
        href: "/plans/S5",
        type: "private_tour",
        planId: "S5",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "アクセスを調べ終えた方へ",
      title: "翌日以降の海の予定も、先に押さえておく",
      description:
        "少人数制のため希望の時間帯は早めに埋まります。前日までのキャンセルは無料なので、日程だけ先に確保する方が多いです。",
      features: ["前日までキャンセル無料", "5歳から参加可能", "写真・動画データは無料"],
      primary: {
        label: "ウミガメツアーの空きを見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "到着日に参加できる空きを見る",
    href: "/book?plan=S3",
    type: "booking",
    planId: "S3",
  },
  related: [
    {
      kind: "plan",
      planId: "S3",
      description: "日没後スタートで所要約1.5時間。到着日でも組み込みやすいツアーです。",
    },
    {
      kind: "post",
      slug: "17end-complete-guide",
      description: "下地島空港のすぐ北にある17END。干潮のタイミングと歩き方をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-rental-car-beginner-guide",
      description: "空港からの移動に使うレンタカーの予約方法と運転のコツをまとめています。",
    },
  ],
}

const RENTAL_CAR_CTA: ArticleCtaConfig = {
  campaign: "rental_car_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "ドライブ計画を立てている方へ",
      title: "海のツアーは集合場所まで自走が基本です",
      description:
        "ツアーの集合場所は当日の海況で決まるため、レンタカーがあると動きやすくなります。集合場所は前日までにお伝えします。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "集合場所についてLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "1日の回り方を決める方へ",
      title: "所要2時間なら、ドライブの合間に入ります",
      description:
        "ウミガメシュノーケルは約2時間です。午前に海、午後に絶景ドライブという組み方をされる方が多いです。",
      features: ["所要は約2時間", "器材・ライフジャケット込み", "写真・動画データは無料"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "ドローンSUP体験を見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "レンタカーガイドを読んだ方へ",
      title: "夜の運転が不安なら、夜は歩く予定にする",
      description:
        "ヤシガニ探検は歩いて回る夜のツアーです。集合場所までの運転だけで済むので、長距離の夜間ドライブを避けられます。",
      features: ["所要は約1.5時間", "0歳〜75歳まで参加可能", "前日までキャンセル無料"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
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
      description: "少人数制でウミガメを探すツアー。所要約2時間でドライブの合間に入ります。",
    },
    {
      kind: "post",
      slug: "17end-complete-guide",
      description: "ドライブで向かう17END。駐車場と干潮のタイミングをまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-tourism-latest-2026",
      description: "王道スポットの回り方と交通の注意点を、2026年版でまとめています。",
    },
  ],
}

const HOTEL_GUIDE_CTA: ArticleCtaConfig = {
  campaign: "hotel_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "宿を決めたら次は予定という方へ",
      title: "集合場所は宿ではなく、その日の海況で決まります",
      description:
        "どのエリアに泊まっても参加できます。開催ポイントは当日いちばん条件の良い場所を選ぶため、集合場所は前日までにお伝えします。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "宿からの距離をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "滞在中の予定を組む方へ",
      title: "所要2時間なので、チェックイン前後にも入ります",
      description:
        "午前の回に参加してから宿に入る、あるいは荷物を置いてから午後の回へ。少人数制のため希望の時間帯は早めに埋まります。",
      features: ["所要は約2時間", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "宿泊エリアを決めた方へ",
      title: "夕食までの時間に、夜の予定も入れられます",
      description:
        "ヤシガニ探検は日没後スタートで所要約1.5時間です。夕食前に組み込めるので、滞在中の夜を持て余しません。",
      features: ["0歳〜75歳まで参加可能", "所要は約1.5時間", "前日までキャンセル無料"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "滞在中に参加できる空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "どのエリアに泊まっても参加できる、少人数制のウミガメシュノーケルです。",
    },
    {
      kind: "plan",
      planId: "C1",
      description: "昼はウミガメ、夜はヤシガニ。単品で申し込むより1,000円お得なセットです。",
    },
    {
      kind: "post",
      slug: "miyakojima-tourism-latest-2026",
      description: "王道スポットの回り方を、2026年版の観光導線としてまとめています。",
    },
  ],
}

const FAMILY_3DAYS_CTA: ArticleCtaConfig = {
  campaign: "family_3days",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "子連れで日程を組む方へ",
      title: "年齢によって、入れられる予定が変わります",
      description:
        "シュノーケルは5歳から、夜のヤシガニ探検は0歳から参加できます。お子様の年齢に合わせて、どちらを軸にするか決めると組みやすくなります。",
      primary: {
        label: "子供と参加できるプランを見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "年齢について相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "お子様のペースが心配な方へ",
      title: "貸切なら、途中で休みながら進められます",
      description:
        "他のお客様を気にせず進められるので、途中で疲れても切り上げやすくなります。少人数のご家族でも1組貸切で参加できます。",
      features: ["専属ガイドが1組に付きっきり", "子供用の器材も無料で用意", "写真・動画データは無料"],
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
      eyebrow: "ファミリー日程を読んだ方へ",
      title: "下のお子様がまだ小さいご家族へ",
      description:
        "夜のヤシガニ探検は0歳から参加でき、3歳以下は無料です。抱っこやベビーカーのご家族も参加されていて、三世代でのご参加も歓迎です。",
      features: ["0歳から参加可能・3歳以下無料", "所要は約1.5時間", "昼夜セットは単品より1,000円お得"],
      priceNote: "ナイトツアー単品 一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "家族で参加できる空きを見る",
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
      slug: "miyakojima-kids-snorkeling-age-guide",
      description: "子供は何歳から参加できるのか、年齢別の目安と持ち物をまとめています。",
    },
  ],
}

const COUPLE_3DAYS_CTA: ArticleCtaConfig = {
  campaign: "couple_3days",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "記念日の旅行を計画中の方へ",
      title: "夕日の時間は、一日に一度しかありません",
      description:
        "サンセットSUPはその日の日没時刻に合わせて開始します。日程のどこか一日は、夕方の時間を空けておくと印象が変わります。",
      primary: {
        label: "サンセットSUPの詳細を見る",
        href: "/plans/S8",
        type: "plan_detail",
        planId: "S8",
      },
      secondary: {
        label: "記念日の相談をLINEでする",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "二人だけの時間を過ごしたい方へ",
      title: "1組貸切なら、他のお客様と一緒になりません",
      description:
        "写真を撮る時間もゆっくり取れます。ドローン撮影が付いているので、二人が写った空撮を残せます。",
      features: ["1組貸切・ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "サンセットSUPの空きを見る",
        href: "/book?plan=S8",
        type: "booking",
        planId: "S8",
      },
      secondary: {
        label: "1組貸切のサンセットSUPを見る",
        href: "/plans/S4",
        type: "private_tour",
        planId: "S4",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "カップル向けコースを読んだ方へ",
      title: "昼は海の中、夕方は海の上という一日",
      description:
        "午前にウミガメシュノーケル、夕方にサンセットSUP。同じ日に組むと、水中と空撮の両方の写真が残せます。",
      features: ["少人数制・ガイドがそばでサポート", "前日までキャンセル無料", "写真・動画データは無料"],
      primary: {
        label: "ウミガメツアーの空きを見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "1組貸切のウミガメツアーを見る",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
    },
  ],
  sticky: {
    label: "サンセットSUPの空きを見る",
    href: "/book?plan=S8",
    type: "booking",
    planId: "S8",
  },
  related: [
    {
      kind: "plan",
      planId: "S8",
      description: "夕日の時間に合わせて海へ。ドローン撮影が付いています。",
    },
    {
      kind: "plan",
      planId: "S2",
      description: "1組貸切のウミガメシュノーケル。二人のペースで進められます。",
    },
    {
      kind: "post",
      slug: "miyakojima-photo-spot-instagram-guide",
      description: "宮古島のフォトスポット20選。二人の写真を撮る場所選びの参考にどうぞ。",
    },
  ],
}

const REPEATER_CTA: ArticleCtaConfig = {
  campaign: "repeater_deep_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "定番を回り終えた方へ",
      title: "同じ海でも、貸切だと過ごし方が変わります",
      description:
        "他のお客様のペースに合わせる必要がないため、粘りたいポイントで粘れます。2回目以降の方ほど貸切を選ばれる傾向があります。",
      primary: {
        label: "1組貸切のウミガメツアーを見る",
        href: "/plans/S2",
        type: "private_tour",
        planId: "S2",
      },
      secondary: {
        label: "リクエストをLINEで相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "前回と違う体験を探している方へ",
      title: "海の中は経験済みなら、次は上空から",
      description:
        "ドローンSUPは海の上を進みながら空撮を残すツアーです。シュノーケルとは見える景色が変わります。",
      features: ["ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "1組貸切のドローンSUPを見る",
        href: "/plans/S7",
        type: "private_tour",
        planId: "S7",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "ディープガイドを読んだ方へ",
      title: "一日を通しで使う、まるごと1日セット",
      description:
        "ウミガメシュノーケル・ドローンSUP・ナイトツアーを1日でまとめて回るセットです。滞在日数が短いリピーターの方に選ばれています。",
      features: ["朝から夜まで1日で3種", "セット割引あり", "前日までキャンセル無料"],
      primary: {
        label: "まるごと1日セットの空きを見る",
        href: "/book?plan=C5",
        type: "booking",
        planId: "C5",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "貸切ツアーの空きを見る",
    href: "/book?plan=S2",
    type: "booking",
    planId: "S2",
  },
  related: [
    {
      kind: "plan",
      planId: "S2",
      description: "1組貸切のウミガメシュノーケル。自分たちのペースで進められます。",
    },
    {
      kind: "plan",
      planId: "C5",
      description: "シュノーケル・ドローンSUP・ナイトツアーを1日でまとめて回るセットです。",
    },
    {
      kind: "post",
      slug: "miyakojima-drone-sup-guide",
      description: "ドローンSUPの内容・料金・当日の流れをまとめています。",
    },
  ],
}

const JUNE_TRAVEL_CTA: ArticleCtaConfig = {
  campaign: "june_travel_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "6月の宮古島へ来る方へ",
      title: "海に入れるかどうかは、その日の風と波で決まります",
      description:
        "梅雨の時期でも、風向き次第で穏やかに入れる場所があります。開催ポイントは当日の海況を見てから決めています。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
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
      eyebrow: "天候が読めず迷っている方へ",
      title: "前日までのキャンセルは無料です",
      description:
        "予報が固まらない時期なので、先に日程を押さえてから判断する方が多いです。少人数制のため希望の時間帯は早めに埋まります。",
      features: ["前日までキャンセル無料", "少人数制・ガイドがそばでサポート", "所要は約2時間"],
      primary: {
        label: "希望日の空き状況を見る",
        href: "/book?plan=S1",
        type: "booking",
        planId: "S1",
      },
      secondary: {
        label: "夕方のサンセットSUPを見る",
        href: "/plans/S8",
        type: "plan_detail",
        planId: "S8",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "6月ガイドを読んだ方へ",
      title: "海が荒れた日に切り替えられる予定を持っておく",
      description:
        "夜のヤシガニ探検は陸のツアーなので、波の条件に左右されません。雨のあとはむしろ生き物が出てきやすくなります。",
      features: ["0歳〜75歳まで参加可能", "所要は約1.5時間", "昼夜セットは単品より1,000円お得"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
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
      description: "当日の海況を見てポイントを決める、少人数制のウミガメシュノーケルです。",
    },
    {
      kind: "post",
      slug: "miyakojima-rainy-day-guide",
      description: "雨予報の日に切り替えられる過ごし方をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-snorkeling-outfit-packing",
      description: "季節ごとの服装とウェットスーツ事情を、現地ガイドが解説しています。",
    },
  ],
}

const TOURISM_LATEST_CTA: ArticleCtaConfig = {
  campaign: "tourism_latest_2026",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "初めての宮古島という方へ",
      title: "景色を見る予定に、海に入る時間も足しておく",
      description:
        "展望台やビーチを回るだけでも満足度は高いですが、実際に海に入るかどうかで印象は大きく変わります。ウミガメに会いやすい海域です。",
      primary: {
        label: "ウミガメシュノーケルを見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "回り方をLINEで相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "王道の回り方を探している方へ",
      title: "泳げなくても、浮いたままウミガメを見られます",
      description:
        "ライフジャケットを着けるので、水に顔をつけられれば参加できます。少人数制でガイドがそばに付きます。",
      features: ["5歳から参加可能", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "観光まとめを読んだ方へ",
      title: "滞在が短いなら、1日でまとめる方法もあります",
      description:
        "昼はウミガメ、夜はヤシガニ探検という組み合わせが人気です。単品で申し込むよりセットのほうがお得になります。",
      features: ["昼夜セットは単品より1,000円お得", "3歳以下無料", "前日までキャンセル無料"],
      primary: {
        label: "昼夜セットの空きを見る",
        href: "/book?plan=C1",
        type: "booking",
        planId: "C1",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
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
      kind: "plan",
      planId: "C1",
      description: "昼はウミガメ、夜はヤシガニ。単品で申し込むより1,000円お得なセットです。",
    },
    {
      kind: "post",
      slug: "miyakojima-hotel-accommodation-guide",
      description: "宿泊エリアを4つに分けて、旅行スタイル別に比較しています。",
    },
  ],
}

// ---- グルメ・カフェの記事 ------------------------------------------------

const IRABU_LUNCH_CTA: ArticleCtaConfig = {
  campaign: "irabu_lunch_cafe",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "伊良部・下地を回る方へ",
      title: "午前に海、昼にランチという組み方ができます",
      description:
        "ウミガメシュノーケルは所要約2時間です。午前の回に参加してから、この記事のランチへ向かう流れなら一日を無駄なく使えます。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "当日の集合時間をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "半日を海に使いたい方へ",
      title: "器材は全部込みなので、水着とタオルだけで参加できます",
      description:
        "シュノーケル・マスク・ライフジャケットはツアーに含まれます。ドライブの途中に立ち寄る感覚で参加できます。",
      features: ["所要は約2時間", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "伊良部・下地グルメを読んだ方へ",
      title: "食事のあとの時間も、海の上で使えます",
      description:
        "午後のドローンSUPなら、透明度が高い時間帯に空撮を残せます。海と食をまとめて一日に組み込めます。",
      features: ["ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "ドローンSUPの空きを見る",
        href: "/book?plan=S6",
        type: "booking",
        planId: "S6",
      },
      secondary: {
        label: "海空セット（ウミガメ＋SUP）を見る",
        href: "/plans/C3",
        type: "set_plan",
        planId: "C3",
      },
    },
  ],
  sticky: {
    label: "海のツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "所要約2時間。午前に参加して、昼はランチへ向かう流れで組めます。",
    },
    {
      kind: "post",
      slug: "17end-complete-guide",
      description: "同じエリアの絶景スポット17END。干潮のタイミングと歩き方をまとめています。",
    },
    {
      kind: "post",
      slug: "shimojishima-airport-2026-summer-schedule-access",
      description: "下地島空港の夏ダイヤとアクセス情報を整理しています。",
    },
  ],
}

const IZAKAYA_CTA: ArticleCtaConfig = {
  campaign: "izakaya_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "宮古島の夜を計画中の方へ",
      title: "食事の前に、夜の時間を1.5時間だけ使う",
      description:
        "ヤシガニ探検は日没後スタートで所要約1.5時間です。終わってから居酒屋へ向かえば、夜の時間を二重に使えます。",
      primary: {
        label: "夜のヤシガニ探検を見る",
        href: "/plans/S3",
        type: "plan_detail",
        planId: "S3",
      },
      secondary: {
        label: "開始時間をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "家族で夜を過ごす方へ",
      title: "0歳から参加でき、3歳以下は無料です",
      description:
        "歩く距離は短く、小さなお子様連れでも参加できます。三世代でのご参加も歓迎しています。",
      features: ["0歳〜75歳まで参加可能", "専用懐中電灯の貸出あり", "所要は約1.5時間"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "1組貸切でゆっくり探検する",
        href: "/plans/S5",
        type: "private_tour",
        planId: "S5",
      },
    },
    {
      position: "article_bottom",
      tone: "strong",
      eyebrow: "居酒屋ガイドを読んだ方へ",
      title: "昼と夜をまとめると1,000円お得になります",
      description:
        "昼はウミガメシュノーケル、夜はヤシガニ探検。1日で宮古島の昼と夜を両方楽しんでから、夜の食事へ向かえます。",
      features: ["昼夜セットは単品より1,000円お得", "3歳以下無料", "前日までキャンセル無料"],
      primary: {
        label: "昼夜セットの空きを見る",
        href: "/book?plan=C1",
        type: "booking",
        planId: "C1",
      },
      secondary: {
        label: "ウミガメツアー単品を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
    },
  ],
  sticky: {
    label: "ナイトツアーの空きを見る",
    href: "/book?plan=S3",
    type: "booking",
    planId: "S3",
  },
  related: [
    {
      kind: "plan",
      planId: "S3",
      description: "日没後スタートで所要約1.5時間。夕食の前に組み込めます。",
    },
    {
      kind: "post",
      slug: "miyakojima-night-tour-yashigani-guide",
      description: "ヤシガニが見つかりやすい条件と、当日の持ち物をまとめています。",
    },
    {
      kind: "post",
      slug: "miyakojima-gourmet-complete-guide",
      description: "宮古そばや宮古牛など、島の名物グルメを網羅しています。",
    },
  ],
}

const MORNING_CAFE_CTA: ArticleCtaConfig = {
  campaign: "morning_cafe_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "朝を有効に使いたい方へ",
      title: "朝食のあと、そのまま海へ向かえます",
      description:
        "午前の回に参加すれば、午後は観光やドライブに使えます。朝カフェから海へという流れは、滞在が短い方ほど効きます。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "午前の空き状況をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "午前の予定を決める方へ",
      title: "所要2時間なので、昼前には自由になります",
      description:
        "少人数制のため、午前の回は早めに埋まります。前日までのキャンセルは無料なので、日程だけ先に押さえておく方が多いです。",
      features: ["所要は約2時間", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "モーニング特集を読んだ方へ",
      title: "海の中と海の上を、一日にまとめる",
      description:
        "午前にウミガメシュノーケル、午後にドローンSUP。海空セットなら単品で申し込むより1,000円お得です。",
      features: ["海空セットは単品より1,000円お得", "水中写真とドローン写真の両方", "前日までキャンセル無料"],
      primary: {
        label: "海空セットの空きを見る",
        href: "/book?plan=C3",
        type: "booking",
        planId: "C3",
      },
      secondary: {
        label: "サンセットSUPを見る",
        href: "/plans/S8",
        type: "plan_detail",
        planId: "S8",
      },
    },
  ],
  sticky: {
    label: "午前のツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "午前の回に参加すれば、昼前には自由になります。所要は約2時間です。",
    },
    {
      kind: "plan",
      planId: "C3",
      description: "ウミガメシュノーケルとドローンSUPを1日で。単品より1,000円お得です。",
    },
    {
      kind: "post",
      slug: "miyakojima-cafe-tour-scenic-tropical-sweets",
      description: "海を眺めながら過ごせる絶景カフェと南国スイーツをまとめています。",
    },
  ],
}

const CAFE_TOUR_CTA: ArticleCtaConfig = {
  campaign: "cafe_tour_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "カフェ巡りを予定している方へ",
      title: "眺めるだけでなく、その海に入る時間も作れます",
      description:
        "絶景カフェから見える海は、実際に入るとまた違って見えます。ウミガメシュノーケルは所要約2時間で、カフェ巡りの合間に組み込めます。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "所要時間をLINEで聞く",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "予定の合間に入れたい方へ",
      title: "水着とタオルだけで参加できます",
      description:
        "器材はすべてツアーに含まれます。荷物を増やさずに、カフェ巡りの一日へ海の時間を足せます。",
      features: ["所要は約2時間", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "カフェ巡りの記事を読んだ方へ",
      title: "夕方の時間は、海の上から眺めるという手も",
      description:
        "サンセットSUPはその日の日没時刻に合わせて開始します。カフェで昼を過ごしたあと、夕方に海へ出る流れが組めます。",
      features: ["ドローン撮影付き", "撮影データは無料", "所要は約2時間"],
      primary: {
        label: "サンセットSUPの空きを見る",
        href: "/book?plan=S8",
        type: "booking",
        planId: "S8",
      },
      secondary: {
        label: "日中のドローンSUPを見る",
        href: "/plans/S6",
        type: "plan_detail",
        planId: "S6",
      },
    },
  ],
  sticky: {
    label: "海のツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "所要約2時間。カフェ巡りの合間に組み込めるウミガメシュノーケルです。",
    },
    {
      kind: "plan",
      planId: "S8",
      description: "夕日の時間に合わせて海へ。ドローン撮影が付いています。",
    },
    {
      kind: "post",
      slug: "miyakojima-morning-breakfast-cafe",
      description: "朝の時間に行きたいモーニングと朝カフェをまとめています。",
    },
  ],
}

const GOURMET_CTA: ArticleCtaConfig = {
  campaign: "gourmet_guide",
  cards: [
    {
      position: "article_top",
      tone: "soft",
      eyebrow: "食べ歩きを計画中の方へ",
      title: "食事の予定だけだと、一日が余ります",
      description:
        "ランチとディナーの間に空く時間に、海のツアーを入れる方が多いです。ウミガメシュノーケルは所要約2時間です。",
      primary: {
        label: "ウミガメツアーの詳細を見る",
        href: "/plans/S1",
        type: "plan_detail",
        planId: "S1",
      },
      secondary: {
        label: "空き時間の使い方を相談する",
        href: LINE_CONSULT_URL,
        type: "line",
        external: true,
      },
    },
    {
      position: "article_middle",
      tone: "strong",
      eyebrow: "昼の時間を持て余している方へ",
      title: "泳げなくても、浮いたままウミガメを見られます",
      description:
        "ライフジャケットを着けるので、水に顔をつけられれば参加できます。器材はすべて込みなので手ぶらに近い状態で行けます。",
      features: ["5歳から参加可能", "器材・ライフジャケット込み", "写真・動画データは無料"],
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
      eyebrow: "グルメガイドを読んだ方へ",
      title: "夕食の前に、夜の探検を1.5時間",
      description:
        "ヤシガニ探検は日没後スタートで所要約1.5時間です。終わってから食事へ向かう流れなら、夜の時間を二重に使えます。",
      features: ["0歳〜75歳まで参加可能", "所要は約1.5時間", "前日までキャンセル無料"],
      priceNote: "一律¥4,000・3歳以下無料",
      primary: {
        label: "ナイトツアーの空きを見る",
        href: "/book?plan=S3",
        type: "booking",
        planId: "S3",
      },
      secondary: {
        label: "昼と夜のセットプランを見る",
        href: "/plans/C1",
        type: "set_plan",
        planId: "C1",
      },
    },
  ],
  sticky: {
    label: "海のツアーの空きを見る",
    href: "/book?plan=S1",
    type: "booking",
    planId: "S1",
  },
  related: [
    {
      kind: "plan",
      planId: "S1",
      description: "ランチとディナーの間に組み込める、所要約2時間のツアーです。",
    },
    {
      kind: "post",
      slug: "miyakojima-local-izakaya-guide",
      description: "地元民が通う居酒屋を厳選。宮古牛や海鮮を楽しめる店をまとめています。",
    },
    {
      kind: "post",
      slug: "irabu-shimoji-lunch-cafe-2026",
      description: "伊良部・下地エリアのランチとカフェを、旅行導線に沿って紹介しています。",
    },
  ],
}

/**
 * キーは記事スラッグ（ブログ）またはページパス（ピラーページ）。
 * ここに無いページではCTAを描画しない。
 */
export const ARTICLE_CTA_CONFIGS: Record<string, ArticleCtaConfig> = {
  // アクティビティに直結する記事
  "aragusu-beach-snorkeling-guide": ARAGUSU_BEACH_CTA,
  "miyakojima-kids-snorkeling-age-guide": KIDS_AGE_GUIDE_CTA,
  "miyakojima-beginner-snorkeling-guide": BEGINNER_GUIDE_CTA,
  "miyakojima-snorkeling-tour-vs-self-guide": TOUR_VS_SELF_CTA,
  "miyakojima-night-tour-yashigani-guide": NIGHT_TOUR_CTA,
  "miyakojima-snorkeling-outfit-packing": OUTFIT_PACKING_CTA,
  "miyakojima-drone-sup-guide": DRONE_SUP_CTA,
  "miyakojima-sup-beginner-guide": SUP_BEGINNER_CTA,
  "miyakojima-photo-spot-instagram-guide": PHOTO_SPOT_CTA,
  "miyakojima-coral-reef-conservation": CORAL_REEF_CTA,

  // 旅程・エリアの記事
  "miyakojima-rainy-day-guide": RAINY_DAY_CTA,
  "17end-complete-guide": SEVENTEEN_END_CTA,
  "shimojishima-airport-2026-summer-schedule-access": SHIMOJISHIMA_AIRPORT_CTA,
  "miyakojima-rental-car-beginner-guide": RENTAL_CAR_CTA,
  "miyakojima-hotel-accommodation-guide": HOTEL_GUIDE_CTA,
  "miyakojima-family-2nights-3days": FAMILY_3DAYS_CTA,
  "miyakojima-couple-romantic-2nights-3days": COUPLE_3DAYS_CTA,
  "miyakojima-repeater-deep-guide": REPEATER_CTA,
  "miyakojima-june-travel-guide-2026": JUNE_TRAVEL_CTA,
  "miyakojima-tourism-latest-2026": TOURISM_LATEST_CTA,

  // グルメ・カフェの記事
  "irabu-shimoji-lunch-cafe-2026": IRABU_LUNCH_CTA,
  "miyakojima-local-izakaya-guide": IZAKAYA_CTA,
  "miyakojima-morning-breakfast-cafe": MORNING_CAFE_CTA,
  "miyakojima-cafe-tour-scenic-tropical-sweets": CAFE_TOUR_CTA,
  "miyakojima-gourmet-complete-guide": GOURMET_CTA,

  // ピラーページ
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
