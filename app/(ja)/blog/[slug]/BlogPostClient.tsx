"use client"

import React from "react"
import { ArrowLeft, Calendar, Clock, User, Tag, Share2, Waves, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import Navbar from "@/components/navbar"
import { BLUR_DATA_URLS } from "@/lib/image-placeholders"
import type { BlogCta, BlogPostSummary } from "@/lib/blog"
import { trackEvent } from "@/lib/analytics"
import type { BlogPost } from "@/lib/data"
import { getArticleCtaCard, type ArticleCtaConfig, type RelatedContentItem } from "@/lib/blog/article-cta"
import { splitArticleContent } from "@/lib/blog/split-article-content"
import { ArticleCtaCard } from "@/components/blog/article-cta-card"
import { ArticleRelatedContent } from "@/components/blog/article-related-content"
import { ArticleStickyCta } from "@/components/blog/article-sticky-cta"

// 25%地点＝まだ情報収集中、60%地点＝比較検討中、という読者の状態に合わせてCTAの役割を変える
const CTA_SPLIT_RATIOS = [0.25, 0.6]

interface BlogPostPageProps {
  post: BlogPost
  relatedPosts: BlogPostSummary[]
  cta: BlogCta
  /** 記事内予約導線。定義のある記事だけ渡され、無い記事ではCTAを描画しない。 */
  articleCta?: ArticleCtaConfig
  /** サーバー側で解決済みの「この記事を読んだ方におすすめ」 */
  articleRelated?: RelatedContentItem[]
}

// 本文の「## 」見出しからアンカーIDを作る（目次とh2レンダラーで同じ計算を使う）
function headingText(children: React.ReactNode): string {
  return Array.isArray(children) ? children.map(String).join("") : String(children ?? "")
}
function headingId(text: string): string {
  return `h-${text.trim().replace(/\s+/g, "-")}`
}

// 本文を複数セグメントに分けて描画するため、レンダラーは1か所に持つ。
// セグメントを跨いでも見出しIDの計算は同じなので、目次アンカーは変わらない。
const markdownComponents = {
  // ページのh1は記事タイトルが担うため、本文中の # はh2として描画（h1重複防止）
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h2>
  ),
  // idは目次のアンカー先。scroll-mtで固定ナビ分のオフセットを確保
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      id={headingId(headingText(children))}
      className="text-2xl font-bold text-gray-900 mb-4 mt-8 scroll-mt-20"
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-gray-700 mb-4 leading-relaxed text-pretty">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="text-gray-700">{children}</li>,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-teal-600 underline underline-offset-2 hover:text-teal-700 font-medium">
      {children}
    </a>
  ),
}

export default function BlogPostClient({
  post,
  relatedPosts,
  cta,
  articleCta,
  articleRelated,
}: BlogPostPageProps) {
  // 目次: 本文中の「## 」行を抽出（3つ以上あるときだけ表示）
  const tocHeadings = post.content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^## /, "").trim())

  // CTA定義のある記事だけ本文を分割する。定義が無ければ従来どおり一括描画。
  const contentSegments = articleCta
    ? splitArticleContent(post.content, CTA_SPLIT_RATIOS)
    : [post.content]

  // セグメントの区切りに差し込むCTA（最後のセグメントの後には置かず、末尾は別枠で出す）
  const inlineCtaCards = articleCta
    ? [getArticleCtaCard(articleCta, "article_top"), getArticleCtaCard(articleCta, "article_middle")]
    : []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <Image
          src={post.image || "/placeholder.svg"}
          alt={post.title}
          fill
          className="object-cover"
          loading="lazy"
          quality={70}
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.ocean}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Link href="/blog">
            <Button variant="secondary" size="sm" className="bg-white/90 backdrop-blur-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ブログ一覧に戻る
            </Button>
          </Link>
        </div>

        {/* Title and Meta */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="container mx-auto">
            <Badge className="bg-teal-600 text-white mb-4">{post.category}</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-balance">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {post.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                {formatDate(post.publishedAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />約{post.readTime}分で読めます
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  {/* Excerpt */}
                  <div className="text-xl text-gray-600 mb-8 p-6 bg-teal-50 rounded-xl border-l-4 border-teal-500">
                    {post.excerpt}
                  </div>

                  {/* 目次（長文記事のモバイル可読性向上。見出し3つ以上で表示） */}
                  {tocHeadings.length >= 3 && (
                    <nav aria-label="目次" className="mb-8 rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6">
                      <p className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wide text-emerald-800">
                        <List className="h-4 w-4" aria-hidden="true" />
                        目次
                      </p>
                      <ol className="space-y-2 text-[15px]">
                        {tocHeadings.map((heading) => (
                          <li key={heading}>
                            <a
                              href={`#${headingId(heading)}`}
                              className="text-teal-700 underline-offset-2 hover:text-teal-900 hover:underline"
                            >
                              {heading}
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  )}

                  {/* Content（CTA定義のある記事は25%・60%地点でセグメントに分かれる） */}
                  <div className="prose prose-lg max-w-none">
                    {contentSegments.map((segment, index) => {
                      const inlineCard = inlineCtaCards[index]

                      return (
                        <React.Fragment key={`segment-${index}`}>
                          <ReactMarkdown components={markdownComponents}>{segment}</ReactMarkdown>
                          {articleCta && inlineCard && (
                            <ArticleCtaCard card={inlineCard} campaign={articleCta.campaign} />
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  {/* 記事末尾：おすすめ → 予約カードの順。記事内容に沿った導線を優先する */}
                  {articleCta && (
                    <>
                      {articleRelated && articleRelated.length > 0 && (
                        <ArticleRelatedContent items={articleRelated} campaign={articleCta.campaign} />
                      )}
                      {getArticleCtaCard(articleCta, "article_bottom") && (
                        <ArticleCtaCard
                          card={getArticleCtaCard(articleCta, "article_bottom")!}
                          campaign={articleCta.campaign}
                        />
                      )}
                    </>
                  )}

                  {/* 記事別CTAがある記事では、汎用CTAは重複するので出さない */}
                  {!articleCta && (
                  <div className="mt-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-6 sm:p-7 border border-emerald-100">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 mb-3">
                          <Waves className="h-4 w-4" />
                          {cta.eyebrow}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">{cta.title}</h2>
                        <p className="text-sm sm:text-base leading-relaxed text-gray-600">{cta.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:min-w-44">
                        <Link
                          href={cta.primaryHref}
                          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        >
                          {cta.primaryLabel}
                        </Link>
                        {cta.secondaryHref && cta.secondaryLabel && (
                          <Link
                            href={cta.secondaryHref}
                            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-50"
                          >
                            {cta.secondaryLabel}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Tags */}
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                      <Tag className="h-5 w-5 mr-2 text-gray-600" />
                      <span className="font-semibold text-gray-900">タグ</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Share Button */}
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <Button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post.title,
                            text: post.excerpt,
                            url: window.location.href,
                          })
                        } else {
                          navigator.clipboard.writeText(window.location.href)
                          alert("URLをクリップボードにコピーしました")
                        }
                      }}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      この記事をシェア
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Author Info */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-3">執筆者</h3>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{post.author}</p>
                        <p className="text-sm text-gray-600">海亀兄弟ガイド</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-gray-900 mb-4">関連記事</h3>
                      <div className="space-y-4">
                        {relatedPosts.map((relatedPost) => (
                          <Link key={relatedPost.id} href={`/blog/${relatedPost.id}`}>
                            <div className="group cursor-pointer">
                              <div className="relative h-24 mb-2 rounded-lg overflow-hidden">
                                <Image
                                  src={relatedPost.image || "/placeholder.svg"}
                                  alt={relatedPost.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  loading="lazy"
                                  quality={50}
                                  sizes="(max-width: 1024px) 100vw, 280px"
                                  placeholder="blur"
                                  blurDataURL={BLUR_DATA_URLS.ocean}
                                />
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                                {relatedPost.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(relatedPost.publishedAt)}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CTA */}
                <Card className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-bold mb-2">海亀と泳ごう！</h3>
                    <p className="text-sm mb-4 text-white/90">宮古島で感動の海亀体験を</p>
                    <Link href="/book" onClick={() => trackEvent("book_cta_click", { location: "blog" })}>
                      <Button variant="secondary" size="sm" className="w-full">
                        今すぐ予約
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* スマホ下部の固定CTA。記事詳細ページのみ（ブログ一覧では描画されない） */}
      {articleCta && <ArticleStickyCta sticky={articleCta.sticky} campaign={articleCta.campaign} />}
    </div>
  )
}
