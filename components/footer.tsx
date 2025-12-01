import Link from "next/link"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { TurtleLogo } from "./TurtleLogo"

const CONTACT_INFO = {
  phone: "08053442439",
  email: "Umigamekyoudai@gmail.com",
  address: "沖縄県宮古島市平良西里861-5",
} as const

const QUICK_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/book", label: "プラン・予約" },
  { href: "/staff", label: "スタッフ紹介" },
  { href: "/gallery", label: "ギャラリー" },
  { href: "/blog", label: "ブログ" },
  { href: "/faq", label: "よくある質問" },
] as const

const BUSINESS_HOURS = {
  hours: "7:00 - 18:00",
  status: "年中無休",
  note: "※天候により変更の場合があります",
} as const

export function Footer() {
  return (
    <footer className="bg-emerald-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <TurtleLogo size={40} className="text-white" />
              </div>
              <span className="font-bold text-xl">海亀兄弟</span>
            </div>
            <p className="text-emerald-100 mb-4 max-w-md">
              家族向け少人数制マリン体験で、安心・誠実・やわらかな高揚感をお届けします。
              透明度抜群の海で海亀との感動的な出会いを。
            </p>
            <div className="space-y-2 text-sm text-emerald-200">
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <a href={`tel:${CONTACT_INFO.phone}`} className="hover:text-white transition-colors">
                  {CONTACT_INFO.phone}
                </a>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                <a href={`mailto:${CONTACT_INFO.email}`} className="hover:text-white transition-colors break-all">
                  {CONTACT_INFO.email}
                </a>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{CONTACT_INFO.address}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">クイックリンク</h3>
            <ul className="space-y-2 text-emerald-200">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="font-semibold text-lg mb-4">営業時間</h3>
            <div className="space-y-2 text-emerald-200">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{BUSINESS_HOURS.hours}</span>
              </div>
              <p className="text-sm">{BUSINESS_HOURS.status}</p>
              <p className="text-xs text-emerald-300">{BUSINESS_HOURS.note}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-emerald-800 mt-8 pt-8 text-center text-emerald-200">
          <p className="text-sm">© 2025 海亀兄弟. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
