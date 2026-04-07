"use client"

import Image from "next/image"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { Star, ChevronDown } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

const titleChars = "海亀兄弟".split("")

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60])

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex flex-col overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <Image
          src="/images/gemini-generated-image-rq969urq969urq96.jpeg"
          alt="宮古島の海亀兄弟 - 2匹のウミガメが一緒に泳ぐ様子"
          fill
          priority
          fetchPriority="high"
          quality={90}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.turtle}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60" />
      </motion.div>

      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex-1 flex flex-col justify-center items-center px-5 pt-16 pb-24"
      >
        <div className="text-center max-w-4xl mx-auto w-full">
          {/* Rating badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
            className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3.5 py-2 mb-6 shadow-lg"
          >
            <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 0.6, delay: 0.8 }}>
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </motion.div>
            <span className="text-gray-800 font-bold text-sm sm:text-lg">4.9</span>
            <span className="text-gray-500 text-xs sm:text-sm">/ 10,136件の口コミ</span>
          </motion.div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white mb-4 sm:mb-6 tracking-tight drop-shadow-2xl flex justify-center">
            {titleChars.map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 80, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, filter: "blur(20px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1.2, delay: 1.1, ease: "easeOut" }}
            className="text-xl sm:text-3xl md:text-4xl text-white font-medium mb-3 drop-shadow-lg"
          >
            宮古島でウミガメと泳ごう
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-sm sm:text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md"
          >
            初心者・お子様大歓迎。感動の海亀体験をお届けします。
          </motion.p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 px-2">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.7 }}
            >
              <Link
                href="/book"
                className="block bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base px-8 py-3.5 rounded-full shadow-xl transition-all active:scale-95"
              >
                今すぐ予約する
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20, delay: 1.7 }}
            >
              <a
                href="https://lin.ee/jfp4laz"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold text-base px-8 py-3.5 rounded-full border border-white/40 transition-all active:scale-95"
              >
                LINEで相談
              </a>
            </motion.div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-2 text-white/90 text-xs sm:text-sm font-medium">
            {["器材レンタル無料", "写真データ無料", "保険加入済み"].map((text, i) => (
              <motion.span
                key={text}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20, delay: 2.0 + i * 0.1 }}
                className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
              >
                {text}
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
      >
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/60 text-[10px] tracking-widest uppercase"
        >
          Scroll
        </motion.span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
          <ChevronDown className="w-5 h-5 text-white/60" />
        </motion.div>
      </motion.div>
    </section>
  )
}
