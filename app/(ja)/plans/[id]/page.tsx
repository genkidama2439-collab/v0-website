import { notFound } from "next/navigation"
import { PLAN_DETAILS } from "@/lib/plan-details"
import { EN_PLAN_BY_ID } from "@/lib/i18n/en"
import { PlanDetailPage } from "@/components/plan-detail-page"
import { PlanJsonLd, BreadcrumbJsonLd, FAQJsonLd } from "@/components/json-ld"
import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { Footer } from "@/components/footer"
import { createMetadata } from "@/lib/seo"
import type { Metadata } from "next"

export function generateStaticParams() {
  return Object.keys(PLAN_DETAILS).map((id) => ({ id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const plan = PLAN_DETAILS[params.id]
  if (!plan) return { title: "プランが見つかりません" }
  return createMetadata({
    title: plan.name,
    description: plan.heroDescription,
    path: `/plans/${params.id}`,
    locale: "ja",
    intlBasePath: EN_PLAN_BY_ID[params.id] ? `/plans/${params.id}` : undefined,
    image: plan.image,
  })
}

export default function Page({ params }: { params: { id: string } }) {
  const plan = PLAN_DETAILS[params.id]
  if (!plan) notFound()

  return (
    <div className="min-h-screen-ios main-container ios-scroll-fix">
      <PlanJsonLd plan={plan} />
      {/* このページに表示しているプラン別FAQ（components/plan-detail-page.tsx が plan.faqs を描画）を
          そのまま構造化データにする。表示と一致させるため、同じ配列から作る。 */}
      {plan.faqs.length > 0 && (
        <FAQJsonLd faqs={plan.faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      )}
      <BreadcrumbJsonLd items={[
        { name: "ホーム", url: "https://www.umigamekyoudaimiyakojima.com" },
        { name: "プラン", url: "https://www.umigamekyoudaimiyakojima.com/plans" },
        { name: plan.name, url: `https://www.umigamekyoudaimiyakojima.com/plans/${plan.id}` },
      ]} />
      <Navbar />
      <PlanDetailPage plan={plan} />
      <Footer />
      <MobileCTA />
    </div>
  )
}
