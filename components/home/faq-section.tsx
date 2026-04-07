"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "泳ぎが苦手でも参加できますか？",
    answer: "はい、もちろん参加いただけます！ライフジャケットを着用するので沈む心配はありません。浮き具もご用意しているので、泳ぎに自信がない方でもウミガメと一緒に泳ぐ感動を体験できます。",
  },
  {
    question: "何歳から参加できますか？",
    answer: "シュノーケルツアーは5歳から参加可能です。お子様用の器材も完備しておりますので、ご家族みんなで安心してお楽しみいただけます。",
  },
  {
    question: "雨の日でも開催しますか？",
    answer: "小雨程度であれば開催いたします。海の中に入ってしまえば雨はほとんど気になりません。ただし、台風や強風など安全が確保できない場合は中止とし、全額返金いたします。",
  },
  {
    question: "持ち物は何が必要ですか？",
    answer: "水着、タオル、日焼け止めがあればOKです。シュノーケル器材、ライフジャケット、ウェットスーツは全て無料でレンタルいたします。",
  },
]

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: index * 0.1 }}
      className="border-b border-gray-200 last:border-0"
    >
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-gray-900 font-semibold text-sm md:text-base pr-4 group-hover:text-emerald-600 transition-colors">
          {faq.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </motion.div>
      </motion.button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.p
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              className="text-gray-500 text-sm leading-relaxed pb-5"
            >
              {faq.answer}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-emerald-600 font-semibold text-sm tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            よくある<span className="text-emerald-600">質問</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 rounded-2xl p-6 md:p-8"
        >
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} index={i} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-8"
        >
          <Link
            href="/faq"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            すべてのFAQを見る →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
