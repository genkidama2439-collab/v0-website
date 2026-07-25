// 多言語版（en/ko/zh-tw）ホームのテンプレート。文言はすべて getDict(locale) から取る。
// 元は app/(en)/en/page.tsx の英語ハードコード実装。

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MobileCTA } from "@/components/mobile-cta"
import { BreadcrumbJsonLd } from "@/components/json-ld"
import { createMetadata, SITE_URL } from "@/lib/seo"
import { TrackedCta, TrackedTel } from "@/components/tracked-cta"
import { PLANS, formatPriceWithTilde } from "@/lib/data"
import { getEnPrice } from "@/lib/i18n/en-prices"
import { getDict } from "@/lib/i18n/dict"
import { type IntlLocale, localePath } from "@/lib/i18n/locales"
import { Shield, Camera, CalendarCheck, Users, MessageCircle, Phone, Mail, ChevronRight, Star } from "lucide-react"

const TRUST_ICONS = [Shield, Camera, CalendarCheck, Users]

export function intlHomeMetadata(locale: IntlLocale): Metadata {
  const dict = getDict(locale)
  return createMetadata({
    title: dict.home.metaTitle,
    description: dict.home.metaDescription,
    path: localePath(locale, "/"),
    locale,
    intlBasePath: "/",
  })
}

export function IntlHomePage({ locale }: { locale: IntlLocale }) {
  const dict = getDict(locale)
  const { home, common, planById } = dict
  const visiblePlans = PLANS.filter((plan) => planById[plan.id])
  const topFaqs = dict.faqs.slice(0, 6)
  const home_ = localePath(locale, "/")

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd items={[{ name: common.breadcrumbHome, url: `${SITE_URL}${home_}` }]} />
      <Navbar locale={locale} nav={dict.ui.nav} />

      <main>
        {/* Hero */}
        <section className="relative min-h-[70svh] flex items-center overflow-hidden">
          <Image
            src="/images/gemini-generated-image-rq969urq969urq96.jpeg"
            alt={common.heroImageAlt}
            fill
            priority
            quality={72}
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
          <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 py-20 w-full">
            <span className="inline-flex items-center gap-2 bg-white/90 rounded-full px-3.5 py-1.5 mb-5 shadow-lg">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-gray-900 font-bold text-xs sm:text-sm">{home.hero.badge}</span>
            </span>
            <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 drop-shadow-2xl leading-tight">
              {home.hero.title}
            </h1>
            <p className="max-w-2xl text-base sm:text-xl text-white/90 mb-7 drop-shadow-md leading-relaxed">
              {home.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <TrackedCta
                event="book_cta_click"
                eventProps={{ location: `${locale}_home` }}
                href={localePath(locale, "/book")}
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base px-7 py-3.5 rounded-full shadow-lg transition-all"
              >
                <CalendarCheck className="w-5 h-5" />
                {common.checkAvailability}
              </TrackedCta>
              <Link
                href={localePath(locale, "/plans")}
                className="inline-flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white font-bold text-base px-7 py-3.5 rounded-full border border-white/35 transition-all"
              >
                {common.seeAllTours}
              </Link>
            </div>
          </div>
        </section>

        {/* Trust items */}
        <section className="bg-emerald-50 py-8">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {home.trustItems.map((item, i) => {
              const Icon = TRUST_ICONS[i % TRUST_ICONS.length]
              return (
                <div key={item} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm ring-1 ring-emerald-100">
                  <Icon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">{item}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* About */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">{home.aboutHeading}</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              {home.aboutParagraphs.map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
            <Link
              href={localePath(locale, "/miyakojima-sea-turtle")}
              className="mt-6 inline-flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800"
            >
              {common.readGuideLink}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Tours */}
        <section className="py-16 bg-gradient-to-b from-white to-emerald-50">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{home.toursHeading}</h2>
            <p className="text-gray-600 mb-4 max-w-2xl">{home.toursIntro}</p>
            {/* 貸切限定である理由と使用言語。価格を見る前に必ず目に入る位置に置く */}
            <p className="mb-8 max-w-2xl bg-white ring-1 ring-emerald-100 rounded-2xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
              {dict.priceSupportNote}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visiblePlans.map((plan) => {
                const t = planById[plan.id]
                const comingSoon = plan.status === "coming_soon"
                return (
                  <Link
                    key={plan.id}
                    href={localePath(locale, `/plans/${plan.id}`)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-md ring-1 ring-emerald-100 hover:shadow-xl transition-shadow"
                  >
                    <div className="relative h-48">
                      <Image
                        src={plan.image}
                        alt={t.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      {comingSoon && (
                        <span className="absolute top-3 left-3 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                          {common.comingSoon}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{t.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{t.tagline}</p>
                      <div className="flex items-baseline justify-between">
                        <span className="text-emerald-700 font-black text-xl">
                          {t.priceNote ? formatPriceWithTilde(getEnPrice(plan)) : `¥${getEnPrice(plan).price.toLocaleString()}`}
                          <span className="text-xs font-medium text-gray-500 ml-1">{common.perAdult}</span>
                        </span>
                        <span className="text-xs text-gray-500">{t.ageNote}</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* How to book */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{home.howToBookHeading}</h2>
            <ol className="space-y-5">
              {home.howToBook.map((step, i) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                {home.lineExplainer.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">{home.lineExplainer.text}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-emerald-50">
          <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{home.faqHeading}</h2>
            <p className="text-gray-600 mb-8">{home.faqIntro}</p>
            <div className="space-y-4">
              {topFaqs.map((faq) => (
                <details key={faq.question} className="group bg-white rounded-2xl ring-1 ring-emerald-100 p-5">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                    {faq.question}
                    <ChevronRight className="w-4 h-4 text-emerald-600 group-open:rotate-90 transition-transform flex-shrink-0 ml-3" />
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
            <Link href={localePath(locale, "/faq")} className="mt-6 inline-flex items-center gap-1 text-emerald-700 font-semibold hover:text-emerald-800">
              {common.seeAllQuestions}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{home.contactHeading}</h2>
            <p className="text-gray-600 mb-8">{home.contactText}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <TrackedCta
                event="line_click"
                eventProps={{ location: `${locale}_home` }}
                href="https://lin.ee/jfp4laz"
                external
                className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                {common.messageOnLine}
              </TrackedCta>
              <a
                href="mailto:info@umigamekyoudaimiyakojima.com"
                className="inline-flex items-center justify-center gap-2 bg-white ring-1 ring-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold px-6 py-3 rounded-full transition-colors"
              >
                <Mail className="w-5 h-5" />
                {common.emailUs}
              </a>
              <TrackedTel
                href="tel:08053442439"
                location={`${locale}_home`}
                className="inline-flex items-center justify-center gap-2 bg-white ring-1 ring-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold px-6 py-3 rounded-full transition-colors"
              >
                <Phone className="w-5 h-5" />
                +81-80-5344-2439
              </TrackedTel>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
      <MobileCTA locale={locale} cta={dict.ui.mobileCta} />
    </div>
  )
}
