"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { BLUR_DATA_URLS } from "@/lib/data"

const galleryImages = [
  { src: "/images/s1-sea-turtle-snorkeling.jpg", alt: "ウミガメとシュノーケリング", span: "col-span-2 row-span-2" },
  { src: "/images/dsc06632.jpeg", alt: "宮古島の海", span: "col-span-1 row-span-1" },
  { src: "/images/sunset-sup-silhouettes.jpg", alt: "サンセットSUP", span: "col-span-1 row-span-1" },
  { src: "/images/night-tour-coconut-crab.jpg", alt: "ナイトツアー", span: "col-span-1 row-span-1" },
  { src: "/images/s2-sea-turtle-closeup.jpg", alt: "ウミガメと接近", span: "col-span-1 row-span-1" },
  { src: "/images/gallery-new-1.jpg", alt: "巨大ヤシガニ", span: "col-span-1 row-span-1" },
]

export function GallerySection() {
  return (
    <section className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Gallery</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            こんな<span className="text-emerald-600">写真</span>が撮れます
          </h2>
          <p className="text-gray-500 text-lg">全てスタッフが撮影。データは無料でお渡しします。</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 md:gap-4 aspect-[2/1] md:aspect-[3/1]">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 18,
                delay: i * 0.08,
              }}
              className={`relative rounded-xl overflow-hidden ${img.span} group cursor-pointer`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                quality={75}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URLS.turtle}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3.5 rounded-full transition-all hover:scale-105 shadow-lg"
          >
            ギャラリーをもっと見る
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
