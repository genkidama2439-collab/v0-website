import { isNightTourPlan, PRIVATE_PLAN_IDS } from "@/lib/plan-flags"

export const RENTAL_UNIT_PRICE_YEN = 1000

// 運用ルール: 通常プランは有料、貸切プランは無料（単体・セットを問わず）。
// 貸切版を新設したときの設定漏れを防ぐため、IDを手書きせず PRIVATE_PLAN_IDS から導く。
// 希望者の特定のため選択欄は出すが、追加料金は0円になる。
export const RENTAL_INCLUDED_PLAN_IDS = PRIVATE_PLAN_IDS

export interface RentalSelection {
  category: string
  wetsuitRental?: boolean
  prescriptionMaskRental?: boolean
}

export const planOffersRentals = (planId: string): boolean =>
  !!planId && !isNightTourPlan(planId)

export const getRentalUnitPrice = (planId: string): number =>
  RENTAL_INCLUDED_PLAN_IDS.has(planId) ? 0 : RENTAL_UNIT_PRICE_YEN

export function getRentalCounts(participants: RentalSelection[]) {
  return {
    wetsuit: participants.filter((participant) => participant.wetsuitRental === true).length,
    // 度付きマスクは大人用のみ。料金計算でも子供分を決して加算しない。
    prescriptionMask: participants.filter(
      (participant) =>
        participant.category === "adult" && participant.prescriptionMaskRental === true,
    ).length,
  }
}

export function calculateRentalTotal(planId: string, participants: RentalSelection[]): number {
  if (!planOffersRentals(planId)) return 0

  const counts = getRentalCounts(participants)
  return (counts.wetsuit + counts.prescriptionMask) * getRentalUnitPrice(planId)
}
