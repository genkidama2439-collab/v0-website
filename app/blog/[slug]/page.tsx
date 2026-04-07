import BlogPostClient from "./BlogPostClient"
import { BLOG_POSTS } from "@/lib/data"
import { notFound } from "next/navigation"

export async function generateStaticParams() {
  return BLOG_POSTS.filter((post) => post && typeof post === "object" && post.id && typeof post.id === "string").map(
    (post) => ({
      slug: post.id,
    }),
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.filter((p) => p && typeof p === "object" && p.id && typeof p.id === "string").find(
    (p) => p.id === params.slug,
  )

  if (!post) {
    return {
      title: "記事が見つかりません",
    }
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://www.umigamekyoudaimiyakojima.com/blog/${params.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: post.image ? [{ url: post.image, width: 1200, height: 630, alt: post.title }] : undefined,
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = BLOG_POSTS.filter((p) => p && typeof p === "object" && p.id && typeof p.id === "string").find(
    (p) => p.id === params.slug,
  )

  if (!post) {
    notFound()
  }

  return <BlogPostClient params={params} />
}
