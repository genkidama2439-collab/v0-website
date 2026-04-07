import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"

export const metadata: Metadata = {
  title: "ご予約",
  description: "海亀兄弟のツアー予約ページ。ウミガメシュノーケル、VIP貸切ツアー、ナイトツアー、サンセットSUP。前日までキャンセル無料。",
  alternates: { canonical: "https://www.umigamekyoudaimiyakojima.com/book" },
  robots: { index: false, follow: true },
}
import { MobileCTA } from "@/components/mobile-cta"
import { BubbleBackground } from "@/components/bubble-background"
import { BookingForm } from "@/components/booking-form"
import { Footer } from "@/components/footer"

export default function BookPage() {
  return (
    <div className="min-h-screen">
      <BubbleBackground />
      <Navbar />

      <main className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-emerald-800 mb-4 text-balance">仮予約フォーム</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
              お客様の情報を入力して、素晴らしいマリン体験をご予約ください。 料金は自動計算されます。
            </p>
          </div>

          <BookingForm />
        </div>
      </main>

      <Footer />
      <MobileCTA />
    </div>
  )
}
