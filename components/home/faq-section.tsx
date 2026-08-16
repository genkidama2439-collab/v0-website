"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { getFaqs } from "@/lib/faq"

// FAQの文言は lib/faq.ts が単一ソース。ここでは表示だけを行う。
const faqs = getFaqs("home")

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-gray-900 font-semibold text-sm md:text-base pr-4 group-hover:text-emerald-600 transition-colors">
          {faq.question}
        </span>
        <div className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        </div>
      </button>
      {isOpen && (
        <div className="overflow-hidden">
          <p className="text-gray-500 text-sm leading-relaxed pb-5">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export function FAQSection() {
  return (
    <section className="py-12 sm:py-16 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-emerald-700 font-semibold text-sm tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            よくある<span className="text-emerald-600">質問</span>
          </h2>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
          {faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/faq"
            className="inline-flex items-center text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
          >
            すべてのFAQを見る →
          </Link>
        </div>
      </div>
    </section>
  )
}
