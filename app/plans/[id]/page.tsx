import { notFound } from "next/navigation"
import { PLAN_DETAILS } from "@/lib/plan-details"
import { PlanDetailPage } from "@/components/plan-detail-page"
import { PlanJsonLd, BreadcrumbJsonLd } from "@/components/json-ld"
import { Navbar } from "@/components/navbar"
import { MobileCTA } from "@/components/mobile-cta"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export function generateStaticParams() {
  return Object.keys(PLAN_DETAILS).map((id) => ({ id }))
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const plan = PLAN_DETAILS[params.id]
  if (!plan) return { title: "プランが見つかりません" }
  return {
    title: plan.name,
    description: plan.heroDescription,
    alternates: {
      canonical: `https://www.umigamekyoudaimiyakojima.com/plans/${params.id}`,
    },
    openGraph: {
      title: `${plan.name} | 海亀兄弟`,
      description: plan.heroDescription,
      images: [{ url: plan.image, width: 1200, height: 630, alt: plan.name }],
    },
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const plan = PLAN_DETAILS[params.id]
  if (!plan) notFound()

  return (
    <div className="min-h-screen-ios main-container ios-scroll-fix">
      <PlanJsonLd plan={plan} />
      <BreadcrumbJsonLd items={[
        { name: "ホーム", url: "https://www.umigamekyoudaimiyakojima.com" },
        { name: "プラン", url: "https://www.umigamekyoudaimiyakojima.com/#plans" },
        { name: plan.name, url: `https://www.umigamekyoudaimiyakojima.com/plans/${plan.id}` },
      ]} />
      <Navbar />
      <PlanDetailPage plan={plan} />
      <Footer />
      <MobileCTA />
    </div>
  )
}
