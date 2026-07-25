// 多言語版プラン詳細のテンプレート。元は app/(en)/en/plans/[id]/page.tsx。

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MobileCTA } from "@/components/mobile-cta"
import { BreadcrumbJsonLd } from "@/components/json-ld"
import { createMetadata, SITE_URL } from "@/lib/seo"
import { TrackedCta } from "@/components/tracked-cta"
import { SunsetMonthlyGuide } from "@/components/sunset-monthly-guide"
import { PLANS } from "@/lib/data"
import { getEnPrice } from "@/lib/i18n/en-prices"
import { getDict } from "@/lib/i18n/dict"
import { type IntlLocale, localePath } from "@/lib/i18n/locales"
import { Clock, Users, MapPin, CalendarCheck, Check, AlertTriangle, Backpack, Camera } from "lucide-react"

export function intlPlanStaticParams(locale: IntlLocale) {
  return getDict(locale).plans.map((plan) => ({ id: plan.id }))
}

export function intlPlanDetailMetadata(locale: IntlLocale, id: string): Metadata {
  const dict = getDict(locale)
  const t = dict.planById[id]
  if (!t) return {}
  return createMetadata({
    title: dict.common.planMetaTitles[id] ?? t.name,
    description: t.tagline,
    path: localePath(locale, `/plans/${id}`),
    locale,
    intlBasePath: `/plans/${id}`,
  })
}

export function IntlPlanDetailPage({ locale, id }: { locale: IntlLocale; id: string }) {
  const dict = getDict(locale)
  const { common } = dict
  const t = dict.planById[id]
  const plan = PLANS.find((p) => p.id === id)
  if (!t || !plan) notFound()

  const comingSoon = plan.status === "coming_soon"
  const times = plan.timeTags.filter((tag) => /^\d{2}:\d{2}$/.test(tag))

  return (
    <div className="min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: common.breadcrumbHome, url: `${SITE_URL}${localePath(locale, "/")}` },
          { name: common.breadcrumbTours, url: `${SITE_URL}${localePath(locale, "/plans")}` },
          { name: t.name, url: `${SITE_URL}${localePath(locale, `/plans/${plan.id}`)}` },
        ]}
      />
      <Navbar locale={locale} nav={dict.ui.nav} />
      <main className="pb-24">
        {/* Hero */}
        <section className="relative h-[45svh] min-h-[300px]">
          <Image src={plan.image} alt={t.name} fill priority className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-5xl mx-auto">
            {comingSoon && (
              <span className="inline-block bg-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                {common.comingSoonDetail}
              </span>
            )}
            <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-lg">{t.name}</h1>
            <p className="text-white/90 mt-2 max-w-2xl text-sm sm:text-base drop-shadow">{t.tagline}</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Key facts */}
          <section className="-mt-6 relative z-10 bg-white rounded-3xl shadow-lg ring-1 ring-emerald-100 p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{common.priceAdultLabel}</p>
              <p className="text-emerald-700 font-black text-xl">¥{getEnPrice(plan).price.toLocaleString()}</p>
              {getEnPrice(plan).childPrice !== getEnPrice(plan).price && (
                <p className="text-xs text-gray-500">{common.childPricePrefix}¥{getEnPrice(plan).childPrice.toLocaleString()}</p>
              )}
              {t.priceNote && <p className="text-xs text-gray-500 mt-1">{t.priceNote}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{common.durationLabel}</p>
              <p className="font-bold text-gray-900 inline-flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                {common.durationShort(plan.durationHours)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{common.agesLabel}</p>
              <p className="font-bold text-gray-900 inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                {t.ageNote}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{common.startTimesLabel}</p>
              <p className="font-bold text-gray-900 text-sm">
                {times.length > 0 ? times.join(" / ") : common.dependsOnSunset}
              </p>
            </div>
          </section>

          {/* 貸切限定である理由と使用言語。料金のすぐ下に単独で置く */}
          <p className="mt-4 bg-emerald-50 ring-1 ring-emerald-100 rounded-2xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
            {dict.priceSupportNote}
          </p>

          {/* Description */}
          <section className="mt-10 space-y-4 text-gray-600 leading-relaxed">
            {t.description.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </section>

          {/* Highlights */}
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              {common.highlightsHeading}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {t.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 bg-emerald-50 rounded-xl px-4 py-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </section>

          {/* Included / Bring */}
          <section className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl ring-1 ring-emerald-100 p-6">
              <h2 className="font-bold text-gray-900 mb-3">{common.includedHeading}</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {t.included.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              {t.options && t.options.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-900 text-sm mt-4 mb-2">{common.optionalRentalsHeading}</h3>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {t.options.map((opt) => (
                      <li key={opt.name}>
                        {opt.name}: ¥{opt.price.toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div className="bg-white rounded-2xl ring-1 ring-emerald-100 p-6">
              <h2 className="font-bold text-gray-900 mb-3 inline-flex items-center gap-2">
                <Backpack className="w-4 h-4 text-emerald-600" />
                {common.bringHeading}
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                {t.whatToBring.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Meeting / time notes */}
          {(t.locationNote || t.timeNote) && (
            <section className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-sm text-blue-900 space-y-2">
              {t.locationNote && (
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {t.locationNote}
                </p>
              )}
              {t.timeNote && (
                <p className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {t.timeNote}
                </p>
              )}
              {plan.id === "S4" && <SunsetMonthlyGuide locale={locale} />}
            </section>
          )}

          {/* Precautions */}
          <section className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="font-bold text-amber-900 mb-3 inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {common.notesHeading}
            </h2>
            <ul className="space-y-2 text-sm text-amber-900">
              {t.precautions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <p className="text-sm text-amber-900 mt-3">
              {common.paymentNote.before}
              <Link href={localePath(locale, "/terms")} className="underline">
                {common.paymentNote.linkText}
              </Link>
              {common.paymentNote.after}
            </p>
          </section>

          {/* CTA */}
          <section className="mt-10 text-center">
            {comingSoon ? (
              <p className="text-gray-600">
                {common.comingSoonCta.before}
                <TrackedCta event="line_click" eventProps={{ location: `${locale}_plan_detail`, plan: plan.id }} href="https://lin.ee/jfp4laz" external className="text-emerald-700 underline">
                  {common.comingSoonCta.linkText}
                </TrackedCta>
                {common.comingSoonCta.after}
              </p>
            ) : (
              <TrackedCta
                event="book_cta_click"
                eventProps={{ location: `${locale}_plan_detail`, plan: plan.id }}
                href={`${localePath(locale, "/book")}?plan=${plan.id}`}
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg transition-all"
              >
                <CalendarCheck className="w-5 h-5" />
                {common.bookThisTour}
              </TrackedCta>
            )}
          </section>
        </div>
      </main>
      <Footer locale={locale} />
      <MobileCTA locale={locale} cta={dict.ui.mobileCta} />
    </div>
  )
}
