"use client"

import { useState, useMemo } from "react"
import { Clock, Calendar, Tag } from "lucide-react"
import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/data"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { Footer } from "@/components/footer"
import { BLUR_DATA_URLS } from "@/lib/data"

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("全て")
  const categories = ["全て", ...BLOG_CATEGORIES]

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "全て") return BLOG_POSTS
    return BLOG_POSTS.filter((post) => post.category === selectedCategory)
  }, [selectedCategory])

  // Featured = first post
  const featured = filteredPosts[0]
  const rest = filteredPosts.slice(1)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[40svh] sm:min-h-[50svh] flex items-end overflow-hidden bg-gray-900">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-aerial-ocean.jpg"
            alt=""
            fill
            priority
            quality={80}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URLS.ocean}
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-8 sm:pb-12 pt-24 sm:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-emerald-400 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Blog</p>
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">海亀兄弟ブログ</h1>
            <p className="text-sm sm:text-lg text-white/60 max-w-lg">
              宮古島の海・ウミガメ・アクティビティの最新情報をお届け
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Category filter */}
        <div className="mb-8 sm:mb-10 overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 w-max sm:w-auto sm:flex-wrap sm:justify-center">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-6">{filteredPosts.length}件の記事</p>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">この カテゴリの記事はまだありません</p>
          </div>
        ) : (
          <>
            {/* Featured post - large card */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8 sm:mb-12"
              >
                <Link href={`/blog/${featured.id}`} className="group block">
                  <div className="flex flex-col md:flex-row gap-0 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-500">
                    <div className="relative w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
                      <Image
                        src={featured.image || "/placeholder.svg"}
                        alt={featured.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <span className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full">
                        {featured.category}
                      </span>
                    </div>
                    <div className="p-5 sm:p-8 md:w-1/2 flex flex-col justify-center">
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(featured.publishedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {featured.readTime}分
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-3 leading-tight">
                        {featured.title}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{featured.excerpt}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {featured.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Rest of posts - grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {rest.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                >
                  <Link href={`/blog/${post.id}`} className="group block h-full">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={post.image || "/placeholder.svg"}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                        <span className="absolute top-3 left-3 bg-emerald-500/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {post.category}
                        </span>
                      </div>
                      <div className="p-4 sm:p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-[10px] sm:text-xs text-gray-400 mb-2">
                          <span>{formatDate(post.publishedAt)}</span>
                          <span>{post.readTime}分で読める</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors mb-2 leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
      <MobileCTA />
    </div>
  )
}
