import { BLOG_CATEGORIES, type BlogPost } from "@/lib/data"
import { loadBlogPosts } from "./posts"
import { BLOG_PAGE_SIZE } from "./constants"

export { BLOG_PAGE_SIZE } from "./constants"

const BLOG_POSTS = loadBlogPosts()

export type BlogPostSummary = Omit<BlogPost, "content">

export type BlogCta = {
  eyebrow: string
  title: string
  description: string
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
}

function isPublishablePost(post: BlogPost): boolean {
  return Boolean(post && typeof post === "object" && post.id && typeof post.id === "string")
}

function toSummary({ content, ...summary }: BlogPost): BlogPostSummary {
  return summary
}

function getPostTime(post: BlogPost): number {
  return new Date(post.date || post.publishedAt).getTime() || 0
}

export function getBlogCategories(): string[] {
  const usedCategories = new Set(BLOG_POSTS.filter(isPublishablePost).map((post) => post.category).filter(Boolean))
  return BLOG_CATEGORIES.filter((category) => usedCategories.has(category))
}

export function getBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS.filter(isPublishablePost)].sort((a, b) => getPostTime(b) - getPostTime(a))
}

export function getBlogPostSummaries(): BlogPostSummary[] {
  return getBlogPosts().map(toSummary)
}

export function getBlogPageCount(): number {
  return Math.max(1, Math.ceil(getBlogPostSummaries().length / BLOG_PAGE_SIZE))
}

export function getBlogPost(slug: string): BlogPost | undefined {
  return getBlogPosts().find((post) => post.id === slug || post.slug === slug)
}

export function getRelatedBlogPostSummaries(post: BlogPost, limit = 3): BlogPostSummary[] {
  return getBlogPosts()
    .filter((candidate) => candidate.id !== post.id && candidate.category === post.category)
    .slice(0, limit)
    .map(toSummary)
}

export function getBlogPostCta(post: BlogPost): BlogCta {
  const searchableText = [post.title, post.category, ...post.tags].join(" ")

  // ドローンSUP記事はサンセットSUPより先に判定（SUPキーワードも含むため）
  if (/ドローン|空撮/.test(searchableText)) {
    return {
      eyebrow: "この記事を読んだ方へ",
      title: "ドローン空撮付きの宮古ブルーSUP体験",
      description:
        "日中の透明度の高い海でSUPを楽しみながら、ドローン空撮で宮古島らしい絶景カットを残せます。写真・動画データは無料です。",
      primaryHref: "/plans/S6",
      primaryLabel: "ドローンSUP体験を見る",
      secondaryHref: "/book?plan=S6",
      secondaryLabel: "空き確認する",
    }
  }

  // ナイトツアー/ヤシガニ記事（「子連れ」等でシュノーケル分岐に流れないよう先に判定）
  if (/ナイトツアー|ヤシガニ|夜行性/.test(searchableText)) {
    return {
      eyebrow: "この記事を読んだ方へ",
      title: "0歳から参加できる夜のジャングル探検",
      description:
        "巨大なヤシガニや夜行性の生き物を、ガイドと一緒に探しに行くナイトツアー。一律4,000円・3歳以下無料、写真データも無料です。",
      primaryHref: "/plans/S3",
      primaryLabel: "ナイトツアーを見る",
      secondaryHref: "/book?plan=S3",
      secondaryLabel: "空き確認する",
    }
  }

  if (/SUP|サップ|サンセット|カップル|ロマンチック/.test(searchableText)) {
    return {
      eyebrow: "この記事を読んだ方へ",
      title: "宮古島の夕日を海の上から楽しむなら",
      description:
        "初めてでも乗りやすいボードを使い、夕日の海をゆっくり案内します。記念日やカップル旅行にも合わせやすいサンセットSUPです。通常プランと1組貸切から選べます。",
      primaryHref: "/plans/S8",
      primaryLabel: "サンセットSUPを見る",
      secondaryHref: "/book?plan=S8",
      secondaryLabel: "空き確認する",
    }
  }

  if (/シュノーケル|ウミガメ|海亀|子連れ|ファミリー|初心者|ビーチ|海/.test(searchableText)) {
    return {
      eyebrow: "安全に海を楽しみたい方へ",
      title: "ウミガメと泳ぐ少人数制シュノーケル",
      description:
        "5歳から参加でき、ライフジャケット着用でガイドが近くでサポートします。写真・動画データも無料でお渡ししています。",
      primaryHref: "/plans/S1",
      primaryLabel: "ウミガメシュノーケルを見る",
      secondaryHref: "/book?plan=S1",
      secondaryLabel: "空き確認する",
    }
  }

  if (/雨|天気|ホテル|空港|レンタカー|17END|カフェ|グルメ|居酒屋/.test(searchableText)) {
    return {
      eyebrow: "旅程に海の体験を入れるなら",
      title: "前日までキャンセル無料の宮古島マリン体験",
      description:
        "旅行中の天候や予定に合わせて相談しやすい少人数制ツアーです。ウミガメシュノーケル、ナイトツアー、サンセットSUPから選べます。",
      primaryHref: "/#plans",
      primaryLabel: "体験プランを見る",
      secondaryHref: "/book",
      secondaryLabel: "予約フォームへ",
    }
  }

  return {
    eyebrow: "宮古島で体験も楽しむなら",
    title: "海亀兄弟の少人数制ツアー",
    description:
      "宮古島の海や夜の自然を、初めての方にも分かりやすく案内します。旅行日程に合わせて気軽に相談できます。",
    primaryHref: "/#plans",
    primaryLabel: "体験プランを見る",
    secondaryHref: "/book",
    secondaryLabel: "空き確認する",
  }
}
