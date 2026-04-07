"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Camera, ImageIcon, Heart } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

export function GalleryHero() {
  return (
    <section className="relative min-h-[50svh] sm:min-h-[60svh] flex items-end overflow-hidden">
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <Image
          src="/images/design-mode/DSC02966.JPG.jpeg"
          alt="ギャラリー背景"
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
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-3 drop-shadow-2xl">
            ギャラリー
          </h1>
          <p className="text-sm sm:text-lg text-white/80 max-w-lg mb-6">
            海亀兄弟で撮影した感動の瞬間。全てスタッフがお客様のために撮影した写真です。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex gap-3"
        >
          {[
            { icon: Camera, value: "徹底", label: "安全管理" },
            { icon: ImageIcon, value: "高画質", label: "水中撮影" },
            { icon: Heart, value: "無料", label: "全データ" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-lg px-3 py-2 border border-white/20">
              <s.icon className="w-4 h-4 text-emerald-300 hidden sm:block" />
              <div>
                <p className="text-white font-bold text-sm leading-tight">{s.value}</p>
                <p className="text-white/60 text-[10px]">{s.label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
