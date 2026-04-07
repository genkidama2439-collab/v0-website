"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "T.K さん",
    date: "2025年3月",
    plan: "ウミガメシュノーケル",
    rating: 5,
    text: "5歳の娘と一緒に参加しました。スタッフさんがとても丁寧で、娘も怖がることなく海を楽しめました。ウミガメと一緒に泳ぐ写真は一生の宝物です！",
  },
  {
    name: "M.S さん",
    date: "2025年2月",
    plan: "VIP貸切ツアー",
    rating: 5,
    text: "家族4人で貸切ツアーを利用。自分たちのペースでゆっくり楽しめて最高でした。ウミガメに3匹も会えて、子どもたちは大興奮。写真もたくさんいただけて感謝です。",
  },
  {
    name: "A.Y さん",
    date: "2025年1月",
    plan: "ナイトツアー",
    rating: 5,
    text: "ナイトツアーは期待以上！ヤシガニやオカヤドカリなど、普段見られない生き物に出会えました。ガイドのそういちろうさんの解説がとても面白くて、子どもたちも大満足でした。",
  },
  {
    name: "R.H さん",
    date: "2025年3月",
    plan: "サンセットSUP",
    rating: 5,
    text: "初めてのSUPでしたが、丁寧に教えていただき安心して楽しめました。夕日が海に沈む瞬間は本当に感動的。宮古島に来たら絶対また参加したいです！",
  },
  {
    name: "K.N さん",
    date: "2024年12月",
    plan: "ウミガメシュノーケル",
    rating: 5,
    text: "泳ぎに自信がなかったのですが、ライフジャケットと浮き具のおかげで安心でした。目の前でウミガメが泳ぐ姿は圧巻！器材も写真も無料なのが嬉しいです。",
  },
  {
    name: "S.M さん",
    date: "2025年2月",
    plan: "ウミガメシュノーケル",
    rating: 5,
    text: "少人数制なので、スタッフさんが一人一人しっかり見てくれて安心。子連れでも心配なく参加できました。また宮古島に行ったら絶対リピートします！",
  },
]

function ReviewCard({ review, index }: { review: typeof testimonials[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotate: index % 2 === 0 ? -3 : 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 18,
        delay: index * 0.08,
      }}
      whileHover={{
        y: -6,
        scale: 1.02,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      }}
      className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
    >
      {/* Stars - cascade in */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: review.rating }).map((_, j) => (
          <motion.div
            key={j}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 15,
              delay: index * 0.08 + j * 0.06,
            }}
          >
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          </motion.div>
        ))}
      </div>

      <p className="text-gray-700 text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4">{review.text}</p>

      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-50">
        <div>
          <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
          <p className="text-gray-400 text-xs">{review.date}</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
          {review.plan}
        </span>
      </div>
    </motion.div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-emerald-50/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">Testimonials</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            お客様の<span className="text-emerald-600">声</span>
          </h2>
          <p className="text-gray-500 text-lg">実際に体験されたお客様からの口コミをご紹介</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((review, i) => (
            <ReviewCard key={i} review={review} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
