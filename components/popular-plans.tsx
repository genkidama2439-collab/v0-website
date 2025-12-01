"use client"
import { PLANS } from "@/lib/data"
import PlanCard from "@/components/PlanCard"

export function PopularPlans() {
  const sortedPlans = [...PLANS].sort((a, b) => (a.rank || 999) - (b.rank || 999))

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-emerald-800 mb-4 text-balance">人気プランランキング</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto text-pretty">
            お客様に最も愛される体験プランをランキング形式でご紹介
          </p>
        </div>

        <div className="flex flex-col gap-6 items-center">
          {sortedPlans.map((plan, index) => (
            <PlanCard key={plan.id} plan={plan} priority={index < 3} />
          ))}
        </div>
      </div>
    </section>
  )
}
