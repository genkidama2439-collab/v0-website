"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MessageSquare, Phone } from "lucide-react"
import { FAQS } from "@/lib/data"

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])) // First item open by default

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <section className="py-20 bg-white/50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FAQ List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <Card
              key={index}
              className="glass-card bg-white/70 backdrop-blur-xl rounded-2xl ring-1 ring-emerald-100 shadow-lg overflow-hidden"
            >
              <CardContent className="p-0">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left hover:bg-emerald-50/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-emerald-800 pr-4">{faq.question}</h3>
                    {openItems.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {openItems.has(index) && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-emerald-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-16">
          <Card className="glass-card bg-white/70 backdrop-blur-xl rounded-3xl ring-1 ring-emerald-100 shadow-lg">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold text-emerald-800 mb-4">他にご質問がございますか？</h3>
              <p className="text-gray-600 mb-6">
                上記以外にもご不明な点がございましたら、
                <br />
                お気軽にLINEでお問い合わせください。スタッフが丁寧にお答えいたします。
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-green-200 text-green-700 hover:bg-green-50 rounded-xl bg-transparent"
                  onClick={() => window.open("https://lin.ee/jfp4laz", "_blank")}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  LINEで問い合わせ
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl bg-transparent"
                  onClick={() => window.open("tel:08053442439")}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  電話で問い合わせ
                </Button>
              </div>

              <div className="mt-6 text-sm text-gray-500">
                <p>LINE: 24時間受付（返信は営業時間内）</p>
                <p>電話: 営業時間内（7:00〜18:00）</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
