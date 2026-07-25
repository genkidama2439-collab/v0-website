// 多言語版プラン一覧のテンプレート。元は app/(en)/en/plans/page.tsx。

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MobileCTA } from "@/components/mobile-cta"
import { BreadcrumbJsonLd } from "@/components/json-ld"
import { createMetadata, SITE_URL } from "@/lib/seo"
import { PLANS } from "@/lib/data"
import { getEnPrice } from "@/lib/i18n/en-prices"
import { getDict } from "@/lib/i18n/dict"
import { type IntlLocale, localePath } from "@/lib/i18n/locales"
import { Clock, Users, ChevronRight } from "lucide-react"

export function intlPlansMetadata(locale: IntlLocale): Metadata {
  const dict = getDict(locale)
  return createMetadata({
    title: dict.common.plansMetaTitle,
    description: dict.common.plansMetaDescription,
    path: localePath(locale, "/plans"),
    locale,
    intlBasePath: "/plans",
  })
}

export function IntlPlansPage({ locale }: { locale: IntlLocale }) {
  const dict = getDict(locale)
  const { common, planById } = dict
  const visiblePlans = PLANS.filter((plan) => planById[plan.id])

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: common.breadcrumbHome, url: `${SITE_URL}${localePath(locale, "/")}` },
          { name: common.breadcrumbTours, url: `${SITE_URL}${localePath(locale, "/plans")}` },
        ]}
      />
      <Navbar locale={locale} nav={dict.ui.nav} />
      <main>
        <section className="px-5 sm:px-6 lg:px-8 pt-24 pb-4 sm:pt-28 max-w-6xl mx-auto">
          <p className="text-emerald-600 font-semibold text-xs sm:text-sm tracking-widest uppercase mb-2">{common.tourPlansEyebrow}</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{common.plansTitle}</h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base max-w-2xl">{common.plansIntro}</p>
          {/* 貸切限定である理由と使用言語。価格を見る前に必ず目に入る位置に置く */}
          <p className="mt-4 max-w-2xl bg-emerald-50 ring-1 ring-emerald-100 rounded-2xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {dict.priceSupportNote}
          </p>
        </section>

        <section className="px-5 sm:px-6 lg:px-8 pb-20 max-w-6xl mx-auto">
          <div className="space-y-6 mt-6">
            {visiblePlans.map((plan) => {
              const t = planById[plan.id]
              const comingSoon = plan.status === "coming_soon"
              return (
                <Link
                  key={plan.id}
                  href={localePath(locale, `/plans/${plan.id}`)}
                  className="group flex flex-col sm:flex-row bg-white rounded-3xl overflow-hidden shadow-md ring-1 ring-emerald-100 hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-52 sm:h-auto sm:w-72 flex-shrink-0">
                    <Image
                      src={plan.image}
                      alt={t.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, 288px"
                    />
                    {comingSoon && (
                      <span className="absolute top-3 left-3 bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {common.comingSoon}
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex-1">
                    <h2 className="font-bold text-xl text-gray-900 mb-1">{t.name}</h2>
                    <p className="text-sm text-gray-600 mb-4">{t.tagline}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500 mb-4">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        {common.durationAbout(plan.durationHours)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600" />
                        {t.ageNote}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        {t.priceNote ? (
                          <span className="text-emerald-700 font-black text-2xl">{t.priceNoteShort ?? t.priceNote.split(",")[0].split(".")[0]}</span>
                        ) : (
                          <>
                            <span className="text-emerald-700 font-black text-2xl">¥{getEnPrice(plan).price.toLocaleString()}</span>
                            <span className="text-xs font-medium text-gray-500 ml-1">{common.perAdult}</span>
                            {getEnPrice(plan).childPrice !== getEnPrice(plan).price && (
                              <span className="text-sm text-gray-500 ml-3">¥{getEnPrice(plan).childPrice.toLocaleString()} {common.perChild}</span>
                            )}
                          </>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-sm">
                        {common.detailsLabel}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
      <MobileCTA locale={locale} cta={dict.ui.mobileCta} />
    </div>
  )
}
