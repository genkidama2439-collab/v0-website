"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { BLUR_DATA_URLS } from "@/lib/data"

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  })
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.2, 1])

  return (
    <section ref={sectionRef} className="relative py-16 sm:py-24 md:py-32 overflow-hidden">
      {/* Parallax Background */}
      <motion.div className="absolute inset-0" style={{ scale: bgScale }}>
        <Image
          src="/images/hero-aerial-ocean.jpg"
          alt="宮古島の海"
          fill
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.ocean}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-emerald-900/70 backdrop-blur-[2px]" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40, filter: "blur(15px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-5"
        >
          宮古島で、忘れられない<br className="hidden sm:block" />思い出を作りませんか？
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto"
        >
          ウミガメとの感動的な出会いが、あなたを待っています。
          前日までキャンセル無料だから、気軽にご予約ください。
        </motion.p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href="/book"
              className="block bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-base px-8 py-3.5 rounded-full shadow-xl transition-colors"
            >
              プランを見て予約する
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <a
              href="https://lin.ee/jfp4laz"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#06C755] hover:bg-[#05b34d] text-white font-bold text-base px-8 py-3.5 rounded-full shadow-xl transition-colors"
            >
              LINEで気軽に相談
            </a>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-emerald-200 text-sm mt-6"
        >
          ※ 前日までキャンセル無料 ・ 天候不良の場合は全額返金
        </motion.p>
      </div>
    </section>
  )
}
