"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { BLUR_DATA_URLS } from "@/lib/data"

export function StaffHero() {
  return (
    <section className="relative min-h-[50svh] sm:min-h-[60svh] flex items-end overflow-hidden">
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/crystal-clear-turquoise-ocean-water-with-coral-ree.jpg"
          alt="スタッフ紹介"
          fill
          priority
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.ocean}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      </motion.div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pb-8 sm:pb-12 pt-24 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-emerald-300 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-3">Our Team</p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 drop-shadow-2xl">
            海を愛するスタッフ
          </h1>
          <p className="text-sm sm:text-lg text-white/80 max-w-lg">
            安全・誠実・やわらかな高揚感。経験豊富なプロが、あなたの最高の思い出をつくります。
          </p>
        </motion.div>
      </div>
    </section>
  )
}
