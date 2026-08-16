// 参加条件（対象年齢・60歳以上の案内）について、
// 「ページに書いてある文言」と「フォーム・予約APIが実際に判定する値」が一致することを検査する。
//
// 2026-08-14の情報設計監査で、次の食い違いが見つかったため追加した。
//   - ページ表示は「5〜65歳」なのに、コードは100歳まで受け付けていた
//   - 貸切セット（C2/C4/C6）の注意書きが「本プランをご予約いただけません」になっており、
//     グループ版からの「貸切版をご予約ください」という案内が行き止まりになっていた
//
// オーナー確認の結果（2026-08-14）:
//   - 対象年齢の上限は 65歳（ナイトツアーのみ 75歳）
//   - 貸切セットは 60歳以上を受け付ける

import assert from "node:assert/strict"
import test from "node:test"

import { PLANS } from "./data.ts"
import { PLAN_DETAILS } from "./plan-details.ts"
import {
  ADULT_AGE_MAX_DEFAULT,
  ADULT_AGE_MAX_NIGHT_TOUR,
  ADULT_AGE_MIN,
  PRIVATE_COUNTERPART,
  PRIVATE_PLAN_IDS,
  SENIOR_RESTRICTED_PLAN_IDS,
  getAdultAgeMax,
  getParticipantAgeRange,
  isNightTourPlan,
  isOverParticipantAgeLimit,
  isParticipantAgeValid,
} from "./plan-flags.ts"

/** "5〜65歳" "0歳〜75歳" "5〜65歳（予定）" から下限・上限を取り出す */
function parseAgeRange(text) {
  const match = String(text).match(/(\d+)\s*歳?\s*[〜~-]\s*(\d+)\s*歳/)
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null
}

test("ページ表示の対象年齢の上限が、実際の受付上限と一致する", () => {
  for (const [planId, detail] of Object.entries(PLAN_DETAILS)) {
    const displayed = parseAgeRange(detail.age)
    assert.ok(displayed, `${planId}: 対象年齢の表示「${detail.age}」から数値を読み取れない`)

    assert.equal(
      displayed.max,
      getAdultAgeMax(planId),
      `${planId}: 表示「${detail.age}」の上限と、実際の受付上限（${getAdultAgeMax(planId)}歳）が違う`,
    )
  }
})

test("lib/data.ts の対象年齢表記が plan-details と一致する", () => {
  for (const plan of PLANS) {
    const detail = PLAN_DETAILS[plan.id]
    if (!detail || !plan.ageRange) continue

    const fromData = parseAgeRange(plan.ageRange)
    const fromDetail = parseAgeRange(detail.age)
    assert.ok(fromData, `${plan.id}: data.ts の ageRange「${plan.ageRange}」を読み取れない`)

    assert.deepEqual(
      fromData,
      fromDetail,
      `${plan.id}: data.ts「${plan.ageRange}」と plan-details「${detail.age}」で対象年齢が違う`,
    )
  }
})

test("年齢の判定が上限・下限のちょうど境目で正しく動く", () => {
  for (const plan of PLANS) {
    const max = getAdultAgeMax(plan.id)

    assert.ok(isParticipantAgeValid(plan.id, "adult", max), `${plan.id}: ${max}歳が弾かれている`)
    assert.ok(!isParticipantAgeValid(plan.id, "adult", max + 1), `${plan.id}: ${max + 1}歳が通ってしまう`)
    assert.ok(
      isParticipantAgeValid(plan.id, "adult", ADULT_AGE_MIN),
      `${plan.id}: ${ADULT_AGE_MIN}歳が弾かれている`,
    )

    assert.ok(isOverParticipantAgeLimit(plan.id, max + 1), `${plan.id}: 上限超過を検知できていない`)
    assert.ok(!isOverParticipantAgeLimit(plan.id, max), `${plan.id}: 上限ちょうどを超過扱いしている`)
    assert.ok(!isOverParticipantAgeLimit(plan.id, ""), `${plan.id}: 未入力を超過扱いしている`)
  }
})

test("ナイトツアーだけ上限が高く、それ以外は共通の上限を使う", () => {
  for (const plan of PLANS) {
    assert.equal(
      getAdultAgeMax(plan.id),
      isNightTourPlan(plan.id) ? ADULT_AGE_MAX_NIGHT_TOUR : ADULT_AGE_MAX_DEFAULT,
      `${plan.id}: 上限年齢の切り替え`,
    )
  }

  assert.ok(
    ADULT_AGE_MAX_NIGHT_TOUR > ADULT_AGE_MAX_DEFAULT,
    "ナイトツアーの上限が通常プラン以下になっている",
  )
})

test("60歳以上の案内が行き止まりにならない", () => {
  for (const plan of PLANS) {
    const restricted = SENIOR_RESTRICTED_PLAN_IDS.has(plan.id)

    // 制限があるプランには必ず案内先の貸切版があり、その貸切版は制限がないこと
    if (restricted) {
      const counterpart = PRIVATE_COUNTERPART[plan.id]
      assert.ok(counterpart, `${plan.id}: 60歳以上の案内先が未設定`)
      assert.ok(
        PRIVATE_PLAN_IDS.has(counterpart.id),
        `${plan.id}: 案内先 ${counterpart.id} が貸切プランではない`,
      )
      assert.ok(
        !SENIOR_RESTRICTED_PLAN_IDS.has(counterpart.id),
        `${plan.id}: 案内先 ${counterpart.id} も60歳以上お断りになっており、案内が行き止まりになる`,
      )
    }

    // 貸切プランは60歳以上を受け付ける（2026-08-14 オーナー確認）
    if (PRIVATE_PLAN_IDS.has(plan.id)) {
      assert.ok(
        !SENIOR_RESTRICTED_PLAN_IDS.has(plan.id),
        `${plan.id}: 貸切プランなのに60歳以上お断りになっている`,
      )
    }
  }
})

test("注意事項・説明文の60歳の案内が、コードの判定と矛盾しない", () => {
  const DENY = /60歳以上[^。]*?(ご予約いただけません|参加(?:は)?でき(?:ま)?せん)/
  const INVITE = /60歳以上[^。]*?ご予約ください/

  for (const plan of PLANS) {
    const texts = [...(plan.precautions ?? []), String(plan.description ?? "")]
    const restricted = SENIOR_RESTRICTED_PLAN_IDS.has(plan.id)

    for (const text of texts) {
      if (!text.includes("60歳")) continue

      if (!restricted) {
        // 受け付けるプランに「予約できません」と書いてはいけない
        assert.ok(
          !DENY.test(text),
          `${plan.id}: 60歳以上を受け付けるプランなのに「予約できない」と書かれている\n  → ${text.slice(0, 90)}`,
        )
      } else {
        // 断るプランには、必ず案内先の貸切版名が書かれていること
        if (INVITE.test(text)) {
          const counterpart = PRIVATE_COUNTERPART[plan.id]
          assert.ok(
            counterpart && text.includes(counterpart.name),
            `${plan.id}: 案内文に貸切版（${PRIVATE_COUNTERPART[plan.id]?.name}）の名前がない\n  → ${text.slice(0, 90)}`,
          )
        }
      }
    }
  }
})

test("3歳未満の受け入れがナイトツアー限定になっている", () => {
  for (const plan of PLANS) {
    const under3 = getParticipantAgeRange(plan.id, "adult") && getParticipantAgeRange(plan.id, "under3")
    assert.equal(
      under3 !== null,
      isNightTourPlan(plan.id),
      `${plan.id}: 3歳未満区分の有無がナイトツアー判定と一致しない`,
    )
  }
})
