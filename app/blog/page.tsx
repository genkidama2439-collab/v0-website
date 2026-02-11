"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Calendar, Clock, User, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/data"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("全て")
  const [currentIndex, setCurrentIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const filteredPosts = useMemo(() => {
    const filtered = BLOG_POSTS.filter((post) => {
      const matchesCategory = selectedCategory === "全て" || post.category === selectedCategory
      return matchesCategory
    })

    return filtered
  }, [selectedCategory])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) {
              setCurrentIndex(index)
            }
          }
        })
      },
      {
        root: container,
        threshold: [0.5, 0.75, 1.0],
        rootMargin: "0px",
      },
    )

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => observer.disconnect()
  }, [filteredPosts])

  const scrollToIndex = (index: number) => {
    const card = cardRefs.current[index]
    if (card && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const cardRect = card.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      const scrollLeft = card.offsetLeft - (containerRect.width - cardRect.width) / 2

      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth",
      })
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < filteredPosts.length - 1) {
      scrollToIndex(currentIndex + 1)
    }
  }

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
      <section className="relative py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">海亀兄弟ブログ</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto text-pretty">
            宮古島の海の魅力、海亀との出会い、ダイビングの楽しさを 現地ガイドがお届けします
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="mb-12 space-y-6">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === "全て" ? "default" : "outline"}
              onClick={() => setSelectedCategory("全て")}
              className={`rounded-full ${
                selectedCategory === "全て"
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "border-teal-300 text-teal-700 hover:bg-teal-50"
              }`}
            >
              全て
            </Button>
            {BLOG_CATEGORIES.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full ${
                  selectedCategory === category
                    ? "bg-teal-600 hover:bg-teal-700"
                    : "border-teal-300 text-teal-700 hover:bg-teal-50"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-gray-600">{filteredPosts.length}件の記事が見つかりました</p>
        </div>

        {/* Blog Posts Horizontal Scroll */}
        {filteredPosts.length > 0 ? (
          <div className="relative">
            <div className="hidden md:flex items-center justify-between mb-6">
              <button
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="前の記事へ"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">前へ</span>
              </button>

              <div className="flex gap-2">
                {filteredPosts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === index ? "bg-teal-600 w-8" : "bg-teal-200 w-2 hover:bg-teal-300"
                    }`}
                    aria-label={`記事 ${index + 1} に移動`}
                  />
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentIndex === filteredPosts.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="次の記事へ"
              >
                <span className="text-sm font-medium">次へ</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth gap-8 pb-4"
              style={{
                WebkitOverflowScrolling: "touch",
                scrollSnapType: "x mandatory",
                overscrollBehaviorX: "contain",
                touchAction: "auto", // Changed from "pan-x pinch-zoom" to "auto" to allow vertical scrolling
              }}
              role="region"
              aria-roledescription="carousel"
              aria-label="ブログ記事一覧"
            >
              {filteredPosts.map((post, index) => (
                <div
                  key={post.id}
                  ref={(el) => {
                    cardRefs.current[index] = el
                  }}
                  className="flex-none w-[85vw] md:w-[45vw] lg:w-[30vw] snap-center"
                  style={{
                    scrollSnapAlign: "center",
                    scrollSnapStop: "always",
                  }}
                >
                  <Link href={`/blog/${post.id}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden h-full">
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={post.image || "/placeholder.svg?height=200&width=400&query=blog post"}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-teal-600 text-white">{post.category}</Badge>
                        </div>
                      </div>

                      <CardHeader className="pb-3">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 text-balance leading-tight">
                          {post.title}
                        </h3>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-gray-600 line-clamp-3 text-pretty text-sm leading-relaxed">{post.excerpt}</p>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {post.author}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {post.readTime}分
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(post.publishedAt)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{post.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>

            <div className="flex justify-center items-center mt-6 md:hidden">
              <div className="flex flex-col items-center gap-3">
                <div className="text-sm text-gray-600 font-medium">
                  {currentIndex + 1} / {filteredPosts.length} 記事
                </div>
                <div className="flex gap-2">
                  {filteredPosts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentIndex === index ? "bg-teal-600 w-8" : "bg-teal-200 w-2 hover:bg-teal-300"
                      }`}
                      aria-label={`記事 ${index + 1} に移動`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500">← スワイプして他の記事を見る →</div>
              </div>
            </div>
          </div>
        ) : (
          /* No Results */
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Tag className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">記事が見つかりませんでした</h3>
            <p className="text-gray-500">フィルター条件を変更してもう一度お試しください</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
