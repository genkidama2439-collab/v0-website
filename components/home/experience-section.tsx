"use client"

import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { BLUR_DATA_URLS } from "@/lib/data"

const experiences = [
  { image: "/images/s1-sea-turtle-snorkeling.jpg", title: "ウミガメシュノーケル", subtitle: "安全管理徹底の少人数制ツアー" },
  { image: "/images/night-tour-coconut-crab.jpg", title: "ナイトツアー", subtitle: "夜の冒険へ出かけよう" },
  { image: "/images/sunset-sup-silhouettes.jpg", title: "サンセットSUP", subtitle: "黄金の海に浮かぶひととき" },
]

function ExperienceCard({ exp, index }: { exp: typeof experiences[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ["start end", "end start"] })
  const imageY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ opacity: 1, clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="group relative aspect-[3/4] sm:aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer"
    >
      <motion.div className="absolute inset-[-20%]" style={{ y: imageY }}>
        <Image
          src={exp.image}
          alt={exp.title}
          fill
          quality={75}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.turtle}
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6">
        <p className="text-emerald-300 text-[10px] sm:text-xs font-semibold mb-0.5">{exp.subtitle}</p>
        <h3 className="text-white text-sm sm:text-lg md:text-xl font-bold">{exp.title}</h3>
      </div>
      <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}

export function ExperienceSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-gray-950 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-16"
        >
          <p className="text-emerald-400 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Experiences</p>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-3">
            3つの<span className="text-emerald-400">感動体験</span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-lg max-w-xl mx-auto">
            宮古島の海と自然を、朝から夜まで満喫できる多彩なプラン
          </p>
        </motion.div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
          {experiences.map((exp, i) => (
            <ExperienceCard key={exp.title} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
