"use client"

import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, Clock, User, Tag, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BLOG_POSTS } from "@/lib/data"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import { usePathname } from "next/navigation"
import Navbar from "@/components/navbar"
import { BLUR_DATA_URLS } from "@/lib/data"

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostClient({ params }: BlogPostPageProps) {
  const pathname = usePathname()
  const post = BLOG_POSTS.filter((p) => p && typeof p === "object" && p.id && typeof p.id === "string").find(
    (p) => p.id === params.slug,
  )

  if (!post) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const relatedPosts = BLOG_POSTS.filter(
    (p) =>
      p &&
      typeof p === "object" &&
      p.id &&
      typeof p.id === "string" &&
      p.category &&
      p.category === post.category &&
      p.id !== post.id,
  ).slice(0, 3)

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

                  {/* Content */}
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">{children}</h2>
                        ),
                        h3: ({ children }) => <h3 className="text-xl font-bold text-gray-900 mb-3 mt-6">{children}</h3>,
                        p: ({ children }) => (
                          <p className="text-gray-700 mb-4 leading-relaxed text-pretty">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700">{children}</ul>
                        ),
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      }}
                    >
                      {post.content}
                    </ReactMarkdown>
                  </div>

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
                    <Link href="/book">
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
    </div>
  )
}
