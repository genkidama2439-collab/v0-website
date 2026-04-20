// クーポン定義（サーバー側が唯一の真実）
// クライアントはプレビュー表示用にのみ参照し、最終的な割引額はサーバーが再計算する
export const COUPON_LIST: Record<string, number> = {
  UMIGAME500: 500,
  カメハメハ: 1000,
}

export type ParticipantCategory = 'adult' | 'child' | 'under3'

export function calculateCouponDiscount(
  couponCode: string | undefined | null,
  participants: Array<{ category: string }>
): { discount: number; code: string } {
  if (!couponCode) return { discount: 0, code: '' }
  const discountPerPerson = COUPON_LIST[couponCode]
  if (!discountPerPerson) return { discount: 0, code: '' }
  const eligibleCount = participants.filter(
    (p) => p.category === 'adult' || p.category === 'child'
  ).length
  return { discount: eligibleCount * discountPerPerson, code: couponCode }
}
