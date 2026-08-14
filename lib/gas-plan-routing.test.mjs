// 予約管理GAS（apps-script/umigame-reservation-admin/Code.gs）のプラン振り分けを検査する。
//
// GASはNext.jsから届いた予約データを見て、シートの行数・Googleカレンダーの予定・
// 管理者メールの内訳を決める。ここを間違えると「予約は取れたのにナイトツアーの
// 予定が作られない」「予約自体がエラーになる」といった運用事故になる。
//
// 過去の不具合: 振り分けが備考欄（specialRequests）のテキストだけを見ていたため、
// お客様が要望欄に「ドローンSUP」「ヤシガニ」「貸切」と書いただけで
// 別プラン扱いになっていた。現在は planId を最優先で使う。
//
// GASはCommonJSでもESMでもないため、vmで評価してトップレベル関数を取り出す。
// GASのサービス(SpreadsheetApp等)は振り分け関数からは呼ばれないのでスタブで足りる。

import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import vm from "node:vm"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const GAS_PATH = path.join(ROOT, "apps-script/umigame-reservation-admin/Code.gs")

function loadReservationGas() {
  const sandbox = {
    console,
    Logger: { log() {} },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ toast() {} }),
      getUi: () => ({ createMenu: () => ({ addItem: () => ({ addToUi() {} }) }) }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }),
      getDocumentProperties: () => null,
    },
    LockService: {},
    CalendarApp: {},
    GmailApp: {},
    UrlFetchApp: {},
    ContentService: {},
  }
  vm.createContext(sandbox)
  vm.runInContext(readFileSync(GAS_PATH, "utf8"), sandbox)
  return sandbox
}

const gas = loadReservationGas()

// GASが最終的にどの経路へ振り分けるか。doPost / sendBookingEmail / addToCalendar は
// すべてこの3つの判定の組み合わせで分岐する。
function routeOf(booking) {
  if (gas.c5c6IsTripleBooking_(booking)) {
    return gas.c5c6IsPrivateTriple_(booking) ? "triple-private" : "triple-normal"
  }
  if (gas.isSeaSkyComboBooking(booking)) return "sea-sky"
  if (gas.isComboBooking(booking)) {
    return gas.isPrivateComboBooking_(booking) ? "combo-private" : "combo-normal"
  }
  return "single"
}

// components/booking-form.tsx と app/api/booking/route.ts が実際に組み立てる備考欄の形。
function buildBooking({ planId, planName, comboLines = [], customerNote = "" }) {
  const comboBlock = comboLines.join("\n")
  const specialRequests = comboBlock
    ? customerNote
      ? `${comboBlock}\n───\n${customerNote}`
      : comboBlock
    : customerNote

  return {
    planId,
    planName,
    selectedTime: "09:00",
    adultCount: 2,
    childCount: 0,
    under3Count: 0,
    totalPrice: 19000,
    couponDiscount: 0,
    specialRequests,
  }
}

const BOOKINGS = {
  C1: (note) =>
    buildBooking({
      planId: "C1",
      planName: "ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
      comboLines: [
        "[COMBO booking]",
        "プラン：ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
        "内容：S1 ウミガメシュノーケル + S3 ヤシガニ探検",
        "海亀希望時間：09:00",
        "ヤシガニ探検希望時間：19:20",
      ],
      customerNote: note,
    }),
  C2: (note) =>
    buildBooking({
      planId: "C2",
      planName: "【貸切】ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
      comboLines: [
        "[COMBO booking]",
        "プラン：【貸切】ウミガメシュノーケル＆ヤシガニ探検 昼夜セット",
        "内容：S2 【貸切】ウミガメシュノーケル + S5 【貸切】ヤシガニ探検",
        "海亀希望時間：09:00",
        "ヤシガニ探検希望時間：19:20",
      ],
      customerNote: note,
    }),
  C3: (note) =>
    buildBooking({
      planId: "C3",
      planName: "ウミガメシュノーケル＆ドローンSUP 海空セット",
      comboLines: [
        "[COMBO booking]",
        "プラン：ウミガメシュノーケル＆ドローンSUP 海空セット",
        "内容：S1 ウミガメシュノーケル + S6 ドローンSUP",
        "海亀希望時間：09:00",
        "ドローンSUP希望時間：海況・水位により調整（予約確定時にご案内）",
      ],
      customerNote: note,
    }),
  C5: (note) =>
    buildBooking({
      planId: "C5",
      planName: "ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
      comboLines: [
        "[COMBO booking]",
        "プラン：ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
        "内容：S1 ウミガメシュノーケル + S6 ドローンSUP + S3 ナイトツアー",
        "海亀希望時間：09:00",
        "ドローンSUP希望時間：海況・水位により調整（予約確定時にご案内）",
        "ヤシガニ探検希望時間：19:20",
      ],
      customerNote: note,
    }),
  C6: (note) =>
    buildBooking({
      planId: "C6",
      planName: "【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
      comboLines: [
        "[COMBO booking]",
        "プラン：【貸切】ウミガメシュノーケル＆ドローンSUP＆ナイトツアー まるごと1日セット",
        "内容：S2 【貸切】ウミガメシュノーケル + S7 【貸切】ドローンSUP + S5 【貸切】ナイトツアー",
        "海亀希望時間：09:00",
        "ドローンSUP希望時間：海況・水位により調整（予約確定時にご案内）",
        "ヤシガニ探検希望時間：19:20",
      ],
      customerNote: note,
    }),
  S1: (note) =>
    buildBooking({
      planId: "S1",
      planName: "ウミガメと泳ぐシュノーケルツアー",
      customerNote: note,
    }),
}

test("plan routing follows planId for every booking type", () => {
  assert.equal(routeOf(BOOKINGS.C1()), "combo-normal")
  assert.equal(routeOf(BOOKINGS.C2()), "combo-private")
  assert.equal(routeOf(BOOKINGS.C3()), "sea-sky")
  assert.equal(routeOf(BOOKINGS.C5()), "triple-normal")
  assert.equal(routeOf(BOOKINGS.C6()), "triple-private")
  assert.equal(routeOf(BOOKINGS.S1()), "single")
})

test("free-text requests never change which plan the booking is filed as", () => {
  const notes = [
    "ドローンSUPも興味があります",
    "ヤシガニ探検も気になります",
    "ナイトツアーの空きはありますか",
    "貸切にできますか？",
    "private guide is possible?",
    "[COMBO booking] と書いてみました",
    "まるごと1日セットとの違いを教えてください",
  ]

  for (const note of notes) {
    assert.equal(routeOf(BOOKINGS.C1(note)), "combo-normal", `C1 / ${note}`)
    assert.equal(routeOf(BOOKINGS.C2(note)), "combo-private", `C2 / ${note}`)
    assert.equal(routeOf(BOOKINGS.C3(note)), "sea-sky", `C3 / ${note}`)
    assert.equal(routeOf(BOOKINGS.C5(note)), "triple-normal", `C5 / ${note}`)
    assert.equal(routeOf(BOOKINGS.C6(note)), "triple-private", `C6 / ${note}`)
    assert.equal(routeOf(BOOKINGS.S1(note)), "single", `S1 / ${note}`)
  }
})

test("display time keeps every scheduled activity of the set", () => {
  assert.equal(gas.getBookingDisplayTime(BOOKINGS.C1("ドローンSUPも興味があります")), "09:00 / 19:20")
  assert.equal(gas.getBookingDisplayTime(BOOKINGS.C3("ヤシガニも気になります")), "09:00 / 10:30")
  assert.equal(gas.getBookingDisplayTime(BOOKINGS.C5()), "09:00 / 10:30 / 19:20")
  assert.equal(gas.getBookingDisplayTime(BOOKINGS.S1()), "09:00")
})

test("combo row amounts always add up to the amount the site charged", () => {
  const c1 = gas.getComboRowAmounts_(BOOKINGS.C1("貸切にできますか？"))
  assert.equal(c1.turtle + c1.night, 19000)
  assert.equal(c1.packageType, "通常セット")

  const c2Booking = { ...BOOKINGS.C2(), totalPrice: 32000 }
  const c2 = gas.getComboRowAmounts_(c2Booking)
  assert.equal(c2.turtle + c2.night, 32000)
  assert.equal(c2.packageType, "貸切セット")
})

test("planId が無い古い送信ではテキスト判定へフォールバックする", () => {
  const legacyCombo = { ...BOOKINGS.C1(), planId: undefined }
  const legacySeaSky = { ...BOOKINGS.C3(), planId: undefined }
  const legacyTriple = { ...BOOKINGS.C5(), planId: undefined }

  assert.equal(routeOf(legacyCombo), "combo-normal")
  assert.equal(routeOf(legacySeaSky), "sea-sky")
  assert.equal(routeOf(legacyTriple), "triple-normal")
})
