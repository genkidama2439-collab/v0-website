import { PLAN_DETAILS } from "@/lib/plan-details"
import { PLAN_PRICE_DATA } from "@/lib/plan-price-display"
import { getPlanMaxParticipants } from "@/lib/booking-rules"

export const STAFF_FEE = 1000
export const ADULT_PRICE = PLAN_PRICE_DATA.S1.price
export const CHILD_PRICE = PLAN_PRICE_DATA.S1.childPrice ?? ADULT_PRICE

export interface BookingPlanSummary {
  id: string
  status?: "active" | "coming_soon"
  name: string
  description: string
  price: number
  childPrice?: number
  vipSurcharge?: number
  maxParticipants?: number
  durationHours: number
  features: string[]
  ageRange: string
}

export const BOOKING_PLANS = Object.values(PLAN_DETAILS).reduce<BookingPlanSummary[]>((items, plan) => {
  const price = PLAN_PRICE_DATA[plan.id]
  if (!price) return items

  const durationHours = Number(plan.duration.match(/[\d.]+/)?.[0] ?? 0)

  items.push({
    id: plan.id,
    ...(plan.status ? { status: plan.status } : {}),
    name: plan.name,
    description: plan.heroDescription,
    price: price.price,
    ...(price.childPrice ? { childPrice: price.childPrice } : {}),
    vipSurcharge: 0,
    ...(getPlanMaxParticipants(plan.id) !== undefined
      ? { maxParticipants: getPlanMaxParticipants(plan.id) }
      : {}),
    durationHours,
    features: plan.highlights.map((highlight) => highlight.title),
    ageRange: plan.age,
  })

  return items
}, [])

export const BOOKING_PLAN_BY_ID = Object.fromEntries(BOOKING_PLANS.map((plan) => [plan.id, plan] as const))
