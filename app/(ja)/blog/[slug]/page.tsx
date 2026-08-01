import BlogPostClient from "./BlogPostClient"
import { notFound } from "next/navigation"
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/components/json-ld"
import { getBlogPost, getBlogPostCta, getBlogPostSummaries, getRelatedBlogPostSummaries } from "@/lib/blog"
import { getArticleCtaConfig, resolveRelatedContent } from "@/lib/blog/article-cta"
import { createMetadata, SITE_URL } from "@/lib/seo"

// Markdownに存在するslugだけを公開し、未知slugは確実にHTTP 404にする。
export const dynamicParams = false

export async function generateStaticParams() {
  return getBlogPostSummaries().map((post) => ({
    slug: post.id,
  }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug)

  if (!post) {
    return {
      title: "記事が見つかりません",
    }
  }

  return createMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${params.slug}`,
    image: post.image,
    type: "article",
  })
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug)

  if (!post) {
    notFound()
  }

  // 記事内予約導線。定義のある記事だけCTAが付く（全記事へ一括では入れない）。
  // 関連コンテンツのタイトル・画像はここで解決する（getBlogPost が fs を読むためサーバー側限定）。
  const articleCta = getArticleCtaConfig(post.id)
  const articleRelated = articleCta
    ? resolveRelatedContent(articleCta.related, (slug) => getBlogPost(slug))
    : undefined

  return (
    <>
      <BlogPostingJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: "ホーム", url: `${SITE_URL}/` },
          { name: "ブログ", url: `${SITE_URL}/blog` },
          { name: post.title, url: `${SITE_URL}/blog/${post.id}` },
        ]}
      />
      <BlogPostClient
        post={post}
        relatedPosts={getRelatedBlogPostSummaries(post)}
        cta={getBlogPostCta(post)}
        articleCta={articleCta}
        articleRelated={articleRelated}
      />
    </>
  )
}
