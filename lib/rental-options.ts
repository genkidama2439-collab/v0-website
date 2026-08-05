import { isNightTourPlan } from "@/lib/plan-flags"

export const RENTAL_UNIT_PRICE_YEN = 1000

// 「ウェットスーツ・度付きマスク込み」で案内している貸切プラン。
// 希望者の特定のため選択欄は出すが、追加料金は0円。
// 運用ルール: 通常プランは有料、貸切プランは無料（セットプランも同じ）。
export const RENTAL_INCLUDED_PLAN_IDS = new Set(["S2", "C2", "C4", "C6"])

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
