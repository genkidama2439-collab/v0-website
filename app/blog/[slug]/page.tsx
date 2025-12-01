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
    title: `${post.title} | 海亀兄弟ブログ`,
    description: post.excerpt,
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
