// ============================================================
// プラン分類の単一ソース（Single Source of Truth）
// ------------------------------------------------------------
// セットプランの判定・時間枠・含まれるツアー併記を一元管理する。
// 予約API(app/api/booking/route.ts)・予約フォーム(components/booking-form.tsx)・
// 参加者フォーム(components/participant-form.tsx) は全てここを import して参照する。
//
// 【セットを増やすとき】このファイルの集合と COMBO_CONTENT_TEXT を更新すれば、
//   3ファイルすべてに反映される（個別のコピペ更新漏れによるバグを防ぐ）。
// ============================================================

// セットプラン全般（スタッフ指名不可・複合の備考ブロック付与・60歳お断りの対象）
// C1/C2＝昼夜セット、C3/C4＝海空セット、C5/C6＝まるごと1日セット（トリプル）
export const COMBO_PLAN_IDS = new Set(["C1", "C2", "C3", "C4", "C5", "C6"])
// 夜のヤシガニ探検（ナイトツアー）を含む昼夜セット
export const NIGHT_COMBO_PLAN_IDS = new Set(["C1", "C2"])
// ドローンSUP（昼・連続）を含む海空セット
export const DAY_COMBO_PLAN_IDS = new Set(["C3", "C4"])
// 朝シュノーケル＋昼SUP＋夜ナイトの3アクティビティ複合（夜時刻あり＋SUP連続の両方）
export const TRIPLE_COMBO_PLAN_IDS = new Set(["C5", "C6"])

// スタッフ指名を利用できないプラン
export const STAFF_UNAVAILABLE_PLAN_IDS = new Set([
  "S3", "S4", "S5", "S6", "S7", "S8", "slide-boat", "C1", "C2", "C3", "C4", "C5", "C6",
])
// 開始時刻が固定でない（確定時にLINEで案内する）プラン
// ※ S6/S7（ドローンSUP単品）は 2026-07 から希望時間を選択制に変更（DAY_SUP_TIMES）
export const TIME_OPTIONAL_PLAN_IDS = new Set(["S4", "S8"])
// 60歳以上をお断りするプラン（通常/グループ版のみ）。60歳以上は対応する貸切版へ案内する。
// ※ slide-boat はペアが無いため対象外。貸切版(S2/S4/S5/S7/C2/C4/C6)は60歳以上OK。
export const SENIOR_RESTRICTED_PLAN_IDS = new Set(["S1", "S3", "S6", "S8", "C1", "C3", "C5"])

// グループ版 → 貸切版の対応（60歳以上の案内先）
export const PRIVATE_COUNTERPART: Record<string, { id: string; name: string }> = {
  S1: { id: "S2", name: "【貸切】ウミガメシュノーケルツアー" },
  S3: { id: "S5", name: "【貸切】本格ナイトツアー" },
  S6: { id: "S7", name: "【貸切】宮古島ドローンSUP体験" },
  S8: { id: "S4", name: "【貸切】サンセットSUP" },
  C1: { id: "C2", name: "【貸切】ウミガメシュノーケル＆ヤシガニ探検 昼夜セット" },
  C3: { id: "C4", name: "【貸切】ウミガメシュノーケル＆ドローンSUP 海空セット" },
  C5: { id: "C6", name: "【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット" },
}
// 60歳以上の案内先（貸切版）の名前を返す。対象外は空文字。
export const getPrivateCounterpartName = (planId: string): string =>
  PRIVATE_COUNTERPART[planId]?.name || ""

// 貸切プランのID。PRIVATE_COUNTERPART から導出するので、貸切版を足したときに
// ここへ書き足す必要がない（レンタル無料の設定漏れを繰り返さないための単一ソース）。
export const PRIVATE_PLAN_IDS: ReadonlySet<string> = new Set(
  Object.values(PRIVATE_COUNTERPART).map((counterpart) => counterpart.id),
)

export const isPrivatePlan = (planId: string): boolean => PRIVATE_PLAN_IDS.has(planId)
// 3歳以下が無料で参加できるプラン（ナイトツアー）
export const FREE_UNDER3_PLAN_IDS = new Set(["S3", "S5"])

// セットの夜（ヤシガニ探検）開始時刻の候補
export const COMBO_NIGHT_TIMES = ["19:20", "21:10"]
// セットの海亀（シュノーケル）開始時刻の候補
export const COMBO_TURTLE_TIMES = ["09:00", "11:00", "14:00", "16:00"]
// ドローンSUP単品（S6/S7）の開始時刻の候補（7:00〜16:00の1時間おき）
// ※海況・水位により前後する場合がある旨をフォーム・プランページで併記する
export const DAY_SUP_TIMES = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
]
// セット内のドローンSUPは海亀ツアーと連続開催のため海況・水位で調整（確定時にご案内）
export const DAY_SUP_TIME_NOTE = "海況・水位により調整（予約確定時にご案内）"

export const isComboPlan = (planId: string): boolean => COMBO_PLAN_IDS.has(planId)
export const isTripleComboPlan = (planId: string): boolean => TRIPLE_COMBO_PLAN_IDS.has(planId)
// SUP（ドローンSUP・連続）を含む = 海空セット(C3/C4) + トリプル(C5/C6)
export const planHasSup = (planId: string): boolean =>
  DAY_COMBO_PLAN_IDS.has(planId) || isTripleComboPlan(planId)
// 夜（ナイトツアー）を含み夜時刻の選択が必要 = 昼夜セット(C1/C2) + トリプル(C5/C6)
export const planHasNight = (planId: string): boolean =>
  NIGHT_COMBO_PLAN_IDS.has(planId) || isTripleComboPlan(planId)
// ナイトツアー単品（3歳以下区分・子どもの最低年齢判定に使用）
export const isNightTourPlan = (planId: string): boolean => planId === "S3" || planId === "S5"

// 参加できる年齢の上限。プラン詳細ページの「対象年齢」表記と必ず一致させる。
// （2026-08-14 オーナー確認: 通常プランは65歳まで、ナイトツアーのみ75歳まで）
// 以前はここが 100 歳になっており、ページの「5〜65歳」という表示と食い違っていた。
// 表記との一致は lib/participation-rules.test.mjs が検査する。
export const ADULT_AGE_MIN = 13
export const ADULT_AGE_MAX_DEFAULT = 65
export const ADULT_AGE_MAX_NIGHT_TOUR = 75

export const getAdultAgeMax = (planId: string): number =>
  isNightTourPlan(planId) ? ADULT_AGE_MAX_NIGHT_TOUR : ADULT_AGE_MAX_DEFAULT

export function getParticipantAgeRange(
  planId: string,
  category: string,
): { min: number; max: number } | null {
  if (category === "adult") return { min: ADULT_AGE_MIN, max: getAdultAgeMax(planId) }
  if (category === "child") return { min: isNightTourPlan(planId) ? 4 : 5, max: 12 }
  if (category === "under3" && FREE_UNDER3_PLAN_IDS.has(planId)) return { min: 0, max: 3 }
  return null
}

/**
 * このプランのWeb予約で受け付けられる年齢を超えているか。
 * 超えている場合は区分の付け替えでは解決しないため、案内文を分けるのに使う。
 */
export const isOverParticipantAgeLimit = (planId: string, age: unknown): boolean =>
  typeof age === "number" && Number.isFinite(age) && age > getAdultAgeMax(planId)

export function isParticipantAgeValid(
  planId: string,
  category: string,
  age: unknown,
): age is number {
  const range = getParticipantAgeRange(planId, category)
  return !!range && typeof age === "number" && Number.isFinite(age) && age >= range.min && age <= range.max
}

// 複合プランの「内容」行（含まれる単品ツアーの併記）。備考の [COMBO booking] に入る。
export const COMBO_CONTENT_TEXT: Record<string, string> = {
  C1: "内容：S1 ウミガメシュノーケル + S3 ヤシガニ探検",
  C2: "内容：S2 【貸切】ウミガメシュノーケル + S5 【貸切】ヤシガニ探検",
  C3: "内容：S1 ウミガメシュノーケル + S6 ドローンSUP",
  C4: "内容：S2 【貸切】ウミガメシュノーケル + S7 【貸切】ドローンSUP",
  C5: "内容：S1 ウミガメシュノーケル + S6 ドローンSUP + S3 ナイトツアー",
  C6: "内容：S2 【貸切】ウミガメシュノーケル + S7 【貸切】ドローンSUP + S5 【貸切】ナイトツアー",
}
export const getComboContentText = (planId: string): string =>
  COMBO_CONTENT_TEXT[planId] || ""
