"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Star, Award, Plane } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

const staff = [
  {
    id: "yamachan",
    name: "やまちゃん",
    role: "現場責任者",
    icon: Shield,
    iconColor: "text-emerald-600",
    badgeColor: "bg-emerald-500",
    image: "/yamachan-staff-photo.jpg",
    objectPosition: "center 20%",
    catchphrase: "安全に、楽しく、最高の思い出を。",
    description: "宮古島の海を知り尽くした頼れるリーダー。安全第一で楽しい海の時間をお約束します。",
    details: [
      "宮古島在住歴10年以上",
      "安全管理のプロフェッショナル",
      "お子様からシニアまで丁寧に対応",
      "海況判断のエキスパート",
    ],
    tours: ["ウミガメシュノーケル", "VIP貸切ツアー"],
  },
  {
    id: "hikaru",
    name: "ひかる",
    role: "やまちゃんの右腕",
    icon: Star,
    iconColor: "text-blue-600",
    badgeColor: "bg-blue-500",
    image: "/hikaru-staff-photo.jpg",
    objectPosition: "center 30%",
    catchphrase: "海の生き物の魅力、伝えます！",
    description: "海の生き物が大好きな優しいガイド。初心者やお子さまも安心してお任せください。",
    details: [
      "海洋生物の知識が豊富",
      "初心者対応の名手",
      "写真撮影のセンス抜群",
      "穏やかで安心感のある接客",
    ],
    tours: ["ウミガメシュノーケル", "VIP貸切ツアー"],
  },
  {
    id: "souichiro",
    name: "そういちろう",
    role: "ナイトツアー専門",
    icon: Award,
    iconColor: "text-purple-600",
    badgeColor: "bg-purple-500",
    image: "/souichiro-staff-photo.jpg",
    objectPosition: "center center",
    catchphrase: "夜の宮古島、冒険しよう。",
    description: "アマゾン帰りの冒険家。夜のジャングルのスペシャリストとして、ワクワクする生き物探しをご案内。",
    details: [
      "アマゾン探検の経験あり",
      "夜行性生物のエキスパート",
      "子どもを夢中にさせるトーク力",
      "安全な夜間ガイドの技術",
    ],
    tours: ["本格ナイトツアー", "貸切ナイトツアー"],
  },
  {
    id: "nagi",
    name: "凪",
    role: "ドローンパイロット",
    icon: Plane,
    iconColor: "text-sky-600",
    badgeColor: "bg-sky-500",
    image: "/nagi-staff-photo.jpg",
    objectPosition: "center center",
    catchphrase: "空から見る宮古島、最高ですよ。",
    description: "国家資格を持つドローンパイロット。空からの美しい映像であなたの思い出を特別な一枚に。",
    details: [
      "ドローン国家資格保持",
      "空撮映像のプロフェッショナル",
      "SNS映え間違いなしの撮影技術",
      "サンセットSUPの撮影担当",
    ],
    tours: ["サンセットSUP"],
  },
]

function StaffCard({ member, index }: { member: typeof staff[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-500"
    >
      {/* Photo */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={member.image}
          alt={member.name}
          fill
          quality={80}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URLS.staff}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: member.objectPosition }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Role badge */}
        <span className={`absolute top-4 left-4 ${member.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
          {member.role}
        </span>

        {/* Name overlay on photo */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">{member.name}</h3>
          <p className="text-white/70 text-sm mt-1 italic">&ldquo;{member.catchphrase}&rdquo;</p>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 sm:p-6">
        <p className="text-gray-700 text-sm leading-relaxed mb-5">{member.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-5">
          {member.details.map((detail) => (
            <div key={detail} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-xs text-gray-600">{detail}</span>
            </div>
          ))}
        </div>

        {/* Tours */}
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">担当ツアー</p>
          <div className="flex flex-wrap gap-1.5">
            {member.tours.map((tour) => (
              <span key={tour} className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                {tour}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function StaffGrid() {
  return (
    <section className="py-10 sm:py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Grid - 1col mobile, 2col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {staff.map((member, i) => (
            <StaffCard key={member.id} member={member} index={i} />
          ))}
        </div>

        {/* Team values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 sm:mt-20"
        >
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">Our Values</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              私たちが<span className="text-emerald-600">大切にしていること</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                emoji: "🛡️",
                title: "安全管理の徹底",
                text: "安全講習・保険加入は当然。少人数制でスタッフの目が全員に行き届く体制。どんな海況でもお客様の安全を最優先に判断します。",
              },
              {
                emoji: "🤝",
                title: "誠実な対応",
                text: "無理な勧誘は一切なし。天候が悪ければ正直に中止をお伝えし全額返金。お客様に嘘をつかない、当たり前のことを当たり前に。",
              },
              {
                emoji: "📸",
                title: "思い出をカタチに",
                text: "高画質カメラで全力撮影。枚数制限なし・全データ無料プレゼント。「こんな写真が撮りたい」のリクエストにもお応えします。",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-gray-100"
              >
                <p className="text-2xl mb-3">{value.emoji}</p>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{value.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 sm:mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 max-w-3xl mx-auto">
            <h3 className="text-xl sm:text-3xl font-bold text-white mb-3">
              このスタッフたちと、<br className="sm:hidden" />海に出かけよう
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base mb-6 max-w-lg mx-auto">
              初めてでも大丈夫。私たちが全力でサポートします。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/book"
                className="bg-white text-emerald-700 font-bold text-sm sm:text-base px-8 py-3.5 rounded-full shadow-xl transition-all active:scale-95 hover:bg-emerald-50"
              >
                ツアーを予約する
              </Link>
              <a
                href="https://lin.ee/jfp4laz"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/20 text-white font-bold text-sm sm:text-base px-8 py-3.5 rounded-full border border-white/30 transition-all active:scale-95"
              >
                LINEで質問する
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
