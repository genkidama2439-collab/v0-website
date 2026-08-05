export interface PlanPriceRow {
  label: string
  price: string
  note?: string
}

export interface PlanPriceDisplay {
  rows: PlanPriceRow[]
  caption?: string
  compact: string
}

const UNDER3_FREE_PLAN_IDS = new Set(["S3", "S5"])

export const PLAN_PRICE_DATA: Record<string, { price: number; childPrice?: number; status?: "active" | "coming_soon" }> = {
  S1: { price: 6500, childPrice: 6000 },
  S2: { price: 9000, childPrice: 9000 },
  S3: { price: 4000, childPrice: 4000 },
  S4: { price: 9500, childPrice: 8500 },
  S8: { price: 7500, childPrice: 6500 },
  S5: { price: 8000, childPrice: 8000 },
  S6: { price: 7500, childPrice: 6500 },
  S7: { price: 9500, childPrice: 8500 },
  C1: { price: 9500, childPrice: 9000 },
  C2: { price: 16000, childPrice: 16000 },
  C3: { price: 13000, childPrice: 11500 },
  C4: { price: 17500, childPrice: 16500 },
  C5: { price: 16000, childPrice: 14500 },
  C6: { price: 24500, childPrice: 23500 },
  "slide-boat": { price: 14000, childPrice: 12000, status: "coming_soon" },
}

// プランの呼び名コード（お客様・スタッフが「S1のプラン」等と呼ぶための短い識別タグ）。
// 内部IDがそのままコード（S1〜S7・C1〜C4）。slide-boatのみ短縮コードを割り当てる。
export function getPlanCode(planId: string): string {
  return planId === "slide-boat" ? "SB" : planId.toUpperCase()
}

function formatYen(price: number): string {
  return `¥${price.toLocaleString()}`
}

function getChildAgeNote(planId: string): string {
  if (planId === "S3" || planId === "S5") return "4〜12歳"
  if (planId === "slide-boat") return "5〜12歳予定"
  return "5〜12歳"
}

export function getPlanPriceDisplay(planId: string): PlanPriceDisplay | null {
  const plan = PLAN_PRICE_DATA[planId]
  if (!plan) return null

  const adultPrice = formatYen(plan.price)
  const childPrice = formatYen(plan.childPrice ?? plan.price)
  const rows: PlanPriceRow[] = [
    { label: "大人", price: adultPrice, note: "13歳以上" },
    { label: "子供", price: childPrice, note: getChildAgeNote(planId) },
  ]

  let caption: string | undefined
  if (plan.status === "coming_soon") {
    caption = "料金・対象年齢は予定です"
  } else if (UNDER3_FREE_PLAN_IDS.has(planId)) {
    caption = "3歳以下無料"
  } else if (planId === "S2") {
    caption = "1名あたり・最大10名まで"
  } else if (planId === "S4") {
    caption = "1名あたり・1組貸切・最大10名まで"
  } else if (planId === "S6") {
    caption = "ドローン撮影付き"
  } else if (planId === "S7") {
    caption = "1組貸切・ドローン撮影付き"
  } else if (planId === "C1") {
    caption = "通常¥10,500・1,000円お得"
  } else if (planId === "C2") {
    caption = "貸切通常¥17,000・1,000円お得"
  } else if (planId === "C3") {
    caption = "通常¥14,000・1,000円お得"
  } else if (planId === "C4") {
    caption = "貸切通常¥18,500・1,000円お得"
  } else if (planId === "C5") {
    caption = "通常¥18,000・2,000円お得"
  } else if (planId === "C6") {
    caption = "貸切通常¥26,500・2,000円お得"
  }

  return {
    rows,
    caption,
    compact: `大人${adultPrice} / 子供${childPrice}`,
  }
}
