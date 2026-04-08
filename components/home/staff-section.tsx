"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { BLUR_DATA_URLS } from "@/lib/data"

const staffMembers = [
  {
    name: "やまちゃん",
    role: "現場責任者",
    image: "/yamachan-staff-photo.jpg",
    description: "宮古島の海を知り尽くした頼れるリーダー",
    objectPosition: "center 20%",
  },
  {
    name: "ひかる",
    role: "やまちゃんの右腕",
    image: "/hikaru-staff-photo.jpg",
    description: "海の生き物が大好きな優しいガイド",
    objectPosition: "center center",
  },
  {
    name: "そういちろう",
    role: "ナイトツアー専門",
    image: "/images/night-tour-coconut-crab.jpg",
    description: "夜の冒険のスペシャリスト",
    objectPosition: "center center",
  },
  {
    name: "凪",
    role: "ドローンパイロット",
    image: "/nagi-staff-photo.jpg",
    description: "空からの絶景を記録するプロ",
    objectPosition: "center center",
  },
]

export function StaffSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Our Team</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            頼れる<span className="text-emerald-600">スタッフ</span>
          </h2>
          <p className="text-gray-500 text-lg">安心して楽しめるのは、経験豊富なスタッフがいるから</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {staffMembers.map((staff, i) => (
            <motion.div
              key={staff.name}
              initial={{ opacity: 0, scale: 0.3, rotate: -15 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 14,
                delay: i * 0.12,
              }}
              className="group text-center"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: 3 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-emerald-100 group-hover:ring-emerald-300 transition-colors duration-300"
              >
                <Image
                  src={staff.image}
                  alt={staff.name}
                  fill
                  quality={75}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URLS.staff}
                  className="object-cover"
                  style={{ objectPosition: staff.objectPosition }}
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.12 + 0.3 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-1">{staff.name}</h3>
                <p className="text-emerald-600 text-sm font-medium mb-2">{staff.role}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{staff.description}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/staff"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            スタッフ紹介をもっと見る →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
