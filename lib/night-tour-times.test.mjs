// ナイトツアーの出発時刻（19:20 / 21:10 / 23:20）の検査。
//
// 23:20便は所要1.5時間のため、終了が翌日0:50になる。
// Googleカレンダーの予定が日付をまたいで正しく作られるか、
// 予約受付GASを実際に動かして確認する（ここを間違えると、
// 終了時刻が開始より前になる・別日に登録されるといった事故になる）。

import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import vm from "node:vm"

import { PLANS } from "./data.ts"
import { COMBO_NIGHT_TIMES, NIGHT_TOUR_TIMES, isNightTourPlan, planHasNight } from "./plan-flags.ts"

const EXPECTED_TIMES = ["19:20", "21:10", "23:20"]
const NIGHT_DURATION_MINUTES = 90

test("ナイトツアーの出発時刻に23:20便が含まれる", () => {
  assert.deepEqual(NIGHT_TOUR_TIMES, EXPECTED_TIMES)
  // セットプランの夜の部も同じ時刻を使う（別配列にすると片方だけ増えるため）
  assert.equal(COMBO_NIGHT_TIMES, NIGHT_TOUR_TIMES)
})

test("単品ナイトツアーが共通の出発時刻を使う", () => {
  for (const planId of ["S3", "S5"]) {
    const plan = PLANS.find((item) => item.id === planId)
    assert.ok(plan, `プランが見つからない: ${planId}`)
    assert.deepEqual(plan.timeTags, EXPECTED_TIMES, `${planId}: timeTags`)
    assert.deepEqual(plan.provisionalTimes, EXPECTED_TIMES, `${planId}: provisionalTimes`)
  }
})

test("夜を含むセットプランが予約APIで23:20を受理できる", () => {
  // 予約APIは nightTime を COMBO_NIGHT_TIMES に含まれるかで検証する
  for (const plan of PLANS.filter((item) => planHasNight(item.id))) {
    assert.ok(
      COMBO_NIGHT_TIMES.includes("23:20"),
      `${plan.id}: セットの夜の部で23:20を選べない`,
    )
  }
})

// ------------------------------------------------------------
// 日付またぎ（ここが23:20便の本題）
// ------------------------------------------------------------

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function loadReservationGas(recordedEvents) {
  const sandbox = {
    console,
    Logger: { log() {} },
    CalendarApp: {
      getCalendarById: () => ({
        createEvent(title, start, end) {
          recordedEvents.push({ title, start, end })
          return { setColor() {}, deleteEvent() {}, getId: () => `event-${recordedEvents.length}` }
        },
      }),
    },
    GmailApp: { sendEmail() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ toast() {} }),
      getUi: () => ({ createMenu: () => ({ addItem: () => ({ addToUi() {} }) }) }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }),
      getDocumentProperties: () => null,
    },
    LockService: {},
    UrlFetchApp: {},
    ContentService: {},
  }
  vm.createContext(sandbox)
  vm.runInContext(
    readFileSync(path.join(ROOT, "apps-script/umigame-reservation-admin/Code.gs"), "utf8"),
    sandbox,
  )
  return sandbox
}

const BOOKING_DATE = "2026-09-01"
const baseBooking = {
  customerName: "テスト",
  customerPhone: "090-0000-0000",
  customerEmail: "test@example.com",
  selectedDate: BOOKING_DATE,
  adultCount: 2,
  childCount: 0,
  under3Count: 0,
  totalPrice: 8000,
  couponDiscount: 0,
  participants: [],
}

function calendarEventsFor(booking) {
  const events = []
  const gas = loadReservationGas(events)
  gas.addToCalendar(booking, "大人2名 / 子供0名 / 3歳未満0名")
  return events
}

/** その予定が「予約日の23:20開始・翌日0:50終了」になっているか */
function assertCrossesMidnight(event, label) {
  const start = event.start
  const end = event.end

  assert.ok(end.getTime() > start.getTime(), `${label}: 終了が開始より前になっている`)
  assert.equal(
    end.getTime() - start.getTime(),
    NIGHT_DURATION_MINUTES * 60 * 1000,
    `${label}: 所要時間が${NIGHT_DURATION_MINUTES}分になっていない`,
  )
  assert.equal(start.getHours(), 23, `${label}: 開始が23時台でない`)
  assert.equal(start.getMinutes(), 20, `${label}: 開始が:20でない`)
  assert.equal(start.getDate(), 1, `${label}: 開始が予約日でない`)
  assert.equal(end.getDate(), 2, `${label}: 終了が翌日になっていない`)
  assert.equal(end.getHours(), 0, `${label}: 終了が0時台でない`)
  assert.equal(end.getMinutes(), 50, `${label}: 終了が:50でない`)
}

test("単品ナイトツアーの23:20便が翌日0:50までの予定になる", () => {
  for (const [planId, planName] of [
    ["S3", "本格ナイトツアー"],
    ["S5", "【貸切】本格ナイトツアー"],
  ]) {
    const events = calendarEventsFor({ ...baseBooking, planId, planName, selectedTime: "23:20" })
    assert.equal(events.length, 1, `${planId}: カレンダー予定が1件でない`)
    assertCrossesMidnight(events[0], planId)
  }
})

test("19:20・21:10便は日付をまたがない", () => {
  for (const time of ["19:20", "21:10"]) {
    const events = calendarEventsFor({
      ...baseBooking,
      planId: "S3",
      planName: "本格ナイトツアー",
      selectedTime: time,
    })
    assert.equal(events.length, 1)
    assert.equal(events[0].start.getDate(), 1, `${time}: 開始日`)
    assert.equal(events[0].end.getDate(), 1, `${time}: 同じ日に終わるはず`)
    assert.equal(
      events[0].end.getTime() - events[0].start.getTime(),
      NIGHT_DURATION_MINUTES * 60 * 1000,
      `${time}: 所要時間`,
    )
  }
})

test("セットプランの夜の部を23:20にしても、昼の予定は当日のまま夜だけ翌日へ伸びる", () => {
  const comboRequests = [
    "[COMBO booking]",
    "プラン：ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
    "内容：S1 ウミガメシュノーケル + S3 ヤシガニ探検",
    "海亀希望時間：09:00",
    "ヤシガニ探検希望時間：23:20",
  ].join("\n")

  const events = calendarEventsFor({
    ...baseBooking,
    planId: "C1",
    planName: "ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
    selectedTime: "09:00",
    totalPrice: 19000,
    specialRequests: comboRequests,
  })

  assert.equal(events.length, 2, "昼夜セットのカレンダー予定が2件でない")

  const [day, night] = events
  assert.equal(day.start.getDate(), 1, "昼の予定が予約日でない")
  assert.equal(day.end.getDate(), 1, "昼の予定が日付をまたいでいる")
  assertCrossesMidnight(night, "C1の夜")
})

test("まるごと1日セットの夜を23:20にしても3件すべて正しく作られる", () => {
  const tripleRequests = [
    "[COMBO booking]",
    "プラン：ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
    "内容：S1 ウミガメシュノーケル + S6 ドローンSUP + S3 ナイトツアー",
    "海亀希望時間：09:00",
    "ドローンSUP希望時間：海況・水位により調整（予約確定時にご案内）",
    "ヤシガニ探検希望時間：23:20",
  ].join("\n")

  const events = calendarEventsFor({
    ...baseBooking,
    planId: "C5",
    planName: "ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
    selectedTime: "09:00",
    totalPrice: 32000,
    specialRequests: tripleRequests,
  })

  assert.equal(events.length, 3, "まるごと1日セットのカレンダー予定が3件でない")
  assert.equal(events[0].start.getDate(), 1, "海亀が予約日でない")
  assert.equal(events[1].start.getDate(), 1, "ドローンSUPが予約日でない")
  assertCrossesMidnight(events[2], "C5の夜")
})

test("ナイトツアーの対象年齢はシュノーケル系より広い（表示と一致）", () => {
  // 23:20便の追加でナイトツアーの条件が他プランへ波及していないことの確認
  for (const plan of PLANS) {
    if (!isNightTourPlan(plan.id)) continue
    assert.ok(plan.ageRange.includes("75"), `${plan.id}: 表示上の対象年齢がナイトツアー用でない`)
  }
})
