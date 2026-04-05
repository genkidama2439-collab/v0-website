import Image from "next/image"
import { HelpCircle, MessageCircle, MessageSquare } from "lucide-react"
import { BLUR_DATA_URLS } from "@/lib/data"

export function FAQHero() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with overlay */}
      <Image
        src="/faq-ocean-hero.jpg"
        alt="よくある質問背景"
        fill
        loading="lazy"
        quality={70}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URLS.ocean}
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/60 via-teal-900/40 to-cyan-900/60 z-[1]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="floating">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-balance">よくある質問</h1>
          <p className="text-xl md:text-2xl text-cyan-100 mb-8 max-w-2xl mx-auto text-pretty">
            お客様からよくいただくご質問にお答えします。
            <br />
            不明な点がございましたらお気軽にお問い合わせください。
          </p>

          {/* Contact Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <HelpCircle className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">FAQ</div>
              <div className="text-cyan-100 text-sm">よくある質問</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">LINE</div>
              <div className="text-cyan-100 text-sm">24時間受付</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <MessageCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">電話</div>
              <div className="text-cyan-100 text-sm">営業時間内</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
