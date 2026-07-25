// 外国語サイト（/en /ko /zh-tw）の料金。
//
// 方針: 外国語サイトは貸切（プライベート）プランのみを販売し、料金は日本語サイトと同額。
// 以前は「日本語価格＋¥2,000（英語サポート込み）」としていたが、
// ツアー中の英語対応を約束できる体制ではないため、その上乗せと説明を廃止した。
// 掲載プランそのものを貸切に限定することで、日本語のお客様と同じグループへ
// ご案内しない運用を担保している（掲載範囲は locales.ts の INTL_PLAN_IDS）。
//
// EN_PRICE_DATA を空にしてあるため getEnPrice は常に日本語価格を返す。
// 予約フォーム（表示・合計）と予約API（サーバー請求）が同じ関数を通るので、
// 将来また外国語サイト専用の料金を設ける場合はこのマップに足すだけでよく、
// 表示と請求が食い違うことがない。

export const EN_PRICE_DATA: Record<string, { price: number; childPrice: number }> = {}

// 外国語サイトで表示・請求する価格を返す。マップに無いプランは日本語価格にフォールバック。
export function getEnPrice(plan: { id: string; price: number; childPrice?: number }): {
  price: number
  childPrice: number
} {
  const en = EN_PRICE_DATA[plan.id]
  if (en) return en
  return { price: plan.price, childPrice: plan.childPrice ?? plan.price }
}

// 貸切限定である理由と、ツアー中の使用言語を明示する一文。
// 価格の近く（プラン詳細・予約フォーム・一覧・トップ）に表示する。
export const EN_PRICE_SUPPORT_NOTE =
  "For a safe and smooth experience, we accept bookings from international guests for private tours only. Tours are guided in Japanese, with support in simple English and translation tools."
