import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import vm from "node:vm"

import { PLAN_DETAILS } from "@/lib/plan-details"
import { PLAN_PRICE_DATA } from "@/lib/plan-price-display"

const root = process.cwd()
const reservationGasSource = fs.readFileSync(
  `${root}/apps-script/umigame-reservation-admin/Code.gs`,
  "utf8",
)
const adminGasSource = fs.readFileSync(
  `${root}/apps-script/umigame-reservation-webapp/Code.gs`,
  "utf8",
)
const bookingRouteSource = fs.readFileSync(`${root}/app/api/booking/route.ts`, "utf8")

function evaluateGas(source) {
  const context = vm.createContext({
    console,
    Logger: { log() {} },
    Utilities: {
      formatDate(date, _timezone, format) {
        if (format === "yyyy-MM-dd") {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, "0")
          const day = String(date.getDate()).padStart(2, "0")
          return `${year}-${month}-${day}`
        }
        if (format === "HH:mm") {
          return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
        }
        return ""
      },
    },
  })
  vm.runInContext(source, context)
  return context
}

const reservationGas = evaluateGas(reservationGasSource)
const adminGas = evaluateGas(adminGasSource)

test("reservation and admin GAS share the same canonical 45-column schema", () => {
  assert.equal(reservationGas.HEADERS.length, 45)
  assert.deepEqual(
    [...reservationGas.HEADERS],
    [...adminGas.ADMIN_CANONICAL_HEADERS],
  )
  assert.equal(reservationGas.COLUMNS.LINE_CONFIRM, 20)
  assert.equal(reservationGas.COLUMNS.LINE_RESULT, 21)
  assert.equal(reservationGas.COLUMNS.EMAIL, 22)
  assert.equal(reservationGas.COLUMNS.VISITOR_ID, 23)
  assert.equal(reservationGas.COLUMNS.PLAN_ID, 45)
  assert.equal(adminGas.ADMIN_COLUMNS.PLAN_ID, 45)
})

test("new booking rows preserve T/U for LINE and put customer data from V onward", () => {
  const row = reservationGas.buildBookingRow_(
    new Date("2026-08-13T00:00:00Z"),
    {
      bookingNumber: "TEST-1",
      planId: "S3",
      customerName: "Test",
      customerEmail: "test@example.com",
      customerPhone: "09000000000",
      planName: "本格ナイトツアー",
      customerAnalytics: { visitorId: "visitor" },
      participants: [],
    },
    "大人1名 / 子供0名 / 3歳未満0名",
    "1. Test 30歳 (大人)",
    { time: "19:20", totalPrice: 4000 },
  )

  assert.equal(row.length, 45)
  assert.equal(row[reservationGas.COLUMNS.LINE_CONFIRM - 1], "")
  assert.equal(row[reservationGas.COLUMNS.LINE_RESULT - 1], "")
  assert.equal(row[reservationGas.COLUMNS.EMAIL - 1], "test@example.com")
  assert.equal(row[reservationGas.COLUMNS.VISITOR_ID - 1], "visitor")
  assert.equal(row[reservationGas.COLUMNS.PLAN_ID - 1], "S3")
})

test("booking writes ignore blank checkbox rows and skip duplicate booking numbers", () => {
  class MockRange {
    constructor(sheet, row, column, rowCount, columnCount) {
      this.sheet = sheet
      this.row = row - 1
      this.column = column - 1
      this.rowCount = rowCount
      this.columnCount = columnCount
    }
    getDisplayValues() {
      return this.getValues().map((row) => row.map((value) => String(value ?? "")))
    }
    getValues() {
      return Array.from({ length: this.rowCount }, (_, rowIndex) =>
        Array.from({ length: this.columnCount }, (_, columnIndex) =>
          this.sheet.data[this.row + rowIndex]?.[this.column + columnIndex] ?? "",
        ),
      )
    }
    setValues(values) {
      values.forEach((row, rowIndex) => {
        while (this.sheet.data.length <= this.row + rowIndex) this.sheet.data.push([])
        row.forEach((value, columnIndex) => {
          this.sheet.data[this.row + rowIndex][this.column + columnIndex] = value
        })
      })
      return this
    }
    createTextFinder(searchText) {
      const range = this
      return {
        matchEntireCell() { return this },
        findNext() {
          for (let rowIndex = 0; rowIndex < range.rowCount; rowIndex += 1) {
            const value = range.sheet.data[range.row + rowIndex]?.[range.column]
            if (String(value ?? "") === searchText) {
              return { getRow: () => range.row + rowIndex + 1 }
            }
          }
          return null
        },
      }
    }
  }

  class MockSheet {
    constructor() {
      this.data = Array.from({ length: 10 }, () => Array(45).fill(""))
      this.data[0] = [...reservationGas.HEADERS]
      this.data[1][reservationGas.COLUMNS.BOOKING_NUM - 1] = "EXISTING"
      // 空行のT列にFALSEがあっても、次の予約は3行目へ入るべき。
      this.data[9][reservationGas.COLUMNS.LINE_CONFIRM - 1] = false
    }
    getMaxRows() { return this.data.length }
    getRange(row, column, rowCount = 1, columnCount = 1) {
      return new MockRange(this, row, column, rowCount, columnCount)
    }
  }

  reservationGas.LockService = {
    getScriptLock() {
      return { waitLock() {}, releaseLock() {} }
    },
  }

  const sheet = new MockSheet()
  const newRow = Array(45).fill("")
  newRow[reservationGas.COLUMNS.BOOKING_NUM - 1] = "NEW-BOOKING"

  assert.equal(reservationGas.writeBookingRows_(sheet, [newRow]), true)
  assert.equal(sheet.data[2][reservationGas.COLUMNS.BOOKING_NUM - 1], "NEW-BOOKING")
  assert.equal(reservationGas.writeBookingRows_(sheet, [newRow]), false)
  assert.equal(
    sheet.data.filter((row) => row[reservationGas.COLUMNS.BOOKING_NUM - 1] === "NEW-BOOKING").length,
    1,
  )
})

test("the collision migration separates legacy LINE values from new customer values", () => {
  class MockRange {
    constructor(sheet, row, column, rowCount, columnCount) {
      this.sheet = sheet
      this.row = row - 1
      this.column = column - 1
      this.rowCount = rowCount
      this.columnCount = columnCount
    }
    getDisplayValues() {
      return this.getValues().map((row) => row.map((value) => String(value ?? "")))
    }
    getValues() {
      return Array.from({ length: this.rowCount }, (_, rowIndex) =>
        Array.from({ length: this.columnCount }, (_, columnIndex) =>
          this.sheet.data[this.row + rowIndex]?.[this.column + columnIndex] ?? "",
        ),
      )
    }
    setValues(values) {
      values.forEach((row, rowIndex) => {
        while (this.sheet.data.length <= this.row + rowIndex) this.sheet.data.push([])
        row.forEach((value, columnIndex) => {
          this.sheet.data[this.row + rowIndex][this.column + columnIndex] = value
        })
      })
      return this
    }
    clearDataValidations() { return this }
  }

  class MockSheet {
    constructor(data) { this.data = data }
    getMaxColumns() { return Math.max(...this.data.map((row) => row.length)) }
    getMaxRows() { return Math.max(this.data.length, 10) }
    getLastRow() { return this.data.length }
    getRange(row, column, rowCount = 1, columnCount = 1) {
      return new MockRange(this, row, column, rowCount, columnCount)
    }
    insertColumnsBefore(column, count) {
      this.data.forEach((row) => row.splice(column - 1, 0, ...Array(count).fill("")))
    }
  }

  const collisionHeaders = [
    ...reservationGas.HEADERS.slice(0, 19),
    ...reservationGas.HEADERS.slice(21, 44),
  ]
  const legacyLineRow = Array(collisionHeaders.length).fill("")
  legacyLineRow[19] = true
  legacyLineRow[20] = "✅ LINE送信済み"
  const customerRow = Array(collisionHeaders.length).fill("")
  customerRow[19] = "guest@example.com"
  customerRow[20] = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
  customerRow[21] = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

  const sheet = new MockSheet([collisionHeaders, legacyLineRow, customerRow])
  adminGas.adminMigrateCollidingCustomerColumns_(sheet)

  assert.equal(sheet.data[1][19], true)
  assert.equal(sheet.data[1][20], "✅ LINE送信済み")
  assert.equal(sheet.data[1][21], "")
  assert.equal(sheet.data[1][22], "")
  assert.equal(sheet.data[2][19], "")
  assert.equal(sheet.data[2][20], "")
  assert.equal(sheet.data[2][21], "guest@example.com")
  assert.equal(sheet.data[2][22], "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
  assert.equal(sheet.data[2][23], "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
})

test("both GAS projects clear inherited T/U validations before restoring the LINE columns", () => {
  assert.match(
    reservationGasSource,
    /function clearLineColumnValidations_\(sheet\)[\s\S]*?clearDataValidations\(\)/,
  )
  assert.match(
    adminGasSource,
    /function adminClearLineColumnValidations_\(sheet\)[\s\S]*?clearDataValidations\(\)/,
  )
  assert.match(
    reservationGasSource,
    /insertColumnsBefore\(20, 2\);\s*clearLineColumnValidations_\(sheet\);/,
  )
  assert.match(
    adminGasSource,
    /insertColumnsBefore\(20, 2\);\s*adminClearLineColumnValidations_\(sheet\);/,
  )
  assert.match(
    reservationGasSource,
    /if \(!needsRepair\) return;[\s\S]*?clearLineColumnValidations_\(sheet\);[\s\S]*?setDataValidation\(checkboxRule\)/,
  )
  assert.match(
    adminGasSource,
    /if \(!needsRepair\) return;[\s\S]*?adminClearLineColumnValidations_\(sheet\);[\s\S]*?setDataValidation\(checkboxRule\)/,
  )
  assert.match(reservationGasSource, /BOOKING_SCHEMA_VERSION_PROPERTY/)
  assert.match(adminGasSource, /ADMIN_SCHEMA_VERSION_PROPERTY/)
})

test("invalid checkbox values never appear as a LINE result", () => {
  assert.equal(adminGas.adminNormalizeLineResult_(false), "")
  assert.equal(adminGas.adminNormalizeLineResult_("FALSE"), "")
  assert.equal(adminGas.adminNormalizeLineResult_(" true "), "")
  assert.equal(
    adminGas.adminNormalizeLineResult_("✅ LINE送信済み 2026/08/14"),
    "✅ LINE送信済み 2026/08/14",
  )
  assert.match(reservationGasSource, /function clearInvalidLineResults_\(sheet\)/)
  assert.match(adminGasSource, /function adminClearInvalidLineResults_\(sheet\)/)
})

test("admin plan catalog stays aligned with the website plan names and prices", () => {
  for (const plan of adminGas.ADMIN_PLAN_CATALOG) {
    assert.equal(plan.name, PLAN_DETAILS[plan.id]?.name, `${plan.id} name`)
    assert.equal(plan.adultPrice, PLAN_PRICE_DATA[plan.id]?.price, `${plan.id} adult`)
    assert.equal(
      plan.childPrice,
      PLAN_PRICE_DATA[plan.id]?.childPrice ?? PLAN_PRICE_DATA[plan.id]?.price,
      `${plan.id} child`,
    )
  }
})

test("single, double and triple plan amounts always add up to the entered total", () => {
  for (const [total, count] of [[24000, 1], [24001, 2], [24002, 3]]) {
    const split = [...adminGas.adminSplitAmountByComponents_(total, count)]
    assert.equal(split.length, count)
    assert.equal(split.reduce((sum, value) => sum + value, 0), total)
  }
})

test("combo changes clear coupons and keep SUP 90 minutes after turtle", () => {
  const before = {
    bookingStatus: "確定",
  }
  const plan = adminGas.adminGetPlanById_("C3")
  const normalized = adminGas.adminNormalizeReservationChange_(before, plan, {
    customerName: "Test Guest",
    phone: "09000000000",
    email: "guest@example.com",
    counts: { adult: 2, child: 1, under3: 0 },
    totalPrice: 37500,
    couponCode: "SHOULD-CLEAR",
    couponDiscount: 1000,
    participants: "details",
    participantAges: "35 / 8",
    participantHeights: "170 / 125",
    participantWeights: "65 / 25",
    participantFootSizes: "26 / 20",
    specialRequests: "none",
    bookingStatus: "確定",
    components: [
      { role: "turtle", date: "2099-08-20", time: "10:00" },
      { role: "sup", date: "2099-08-21", time: "15:00" },
    ],
  })

  assert.equal(normalized.couponCode, "")
  assert.equal(normalized.couponDiscount, 0)
  assert.equal(normalized.participantAges, "35 / 8")
  assert.equal(normalized.participantHeights, "170 / 125")
  assert.equal(normalized.participantWeights, "65 / 25")
  assert.equal(normalized.participantFootSizes, "26 / 20")
  assert.equal(normalized.components[1].date, "2099-08-20")
  assert.equal(normalized.components[1].time, "11:30")
})

test("changed rows preserve tracking data and write all editable participant fields", () => {
  const source = Array(45).fill("")
  source[adminGas.ADMIN_COLUMNS.VISITOR_ID - 1] = "visitor-keep"
  source[adminGas.ADMIN_COLUMNS.VISIT_ID - 1] = "visit-keep"
  source[adminGas.ADMIN_COLUMNS.LINE_USER_ID - 1] = "line-keep"
  source[adminGas.ADMIN_COLUMNS.LINE_CONFIRM - 1] = true
  source[adminGas.ADMIN_COLUMNS.LINE_RESULT - 1] = "old pending"

  const sheet = {
    getRange() {
      return { getValues: () => [[...source]] }
    },
  }
  const before = {
    bookingNumber: "TEST-CHANGE",
    rowNumbers: [2],
    components: [{
      plan: "本格ナイトツアー",
      location: "ナイトツアー（遺跡）",
      staff: "担当A",
    }],
  }
  const plan = adminGas.adminGetPlanById_("C1")
  const normalized = adminGas.adminNormalizeReservationChange_(before, plan, {
    customerName: "Changed Guest",
    phone: "09011112222",
    email: "changed@example.com",
    counts: { adult: 1, child: 1, under3: 0 },
    totalPrice: 18501,
    participants: "1. Changed Guest / 2. Child",
    participantAges: "35 / 8",
    participantHeights: "170 / 125",
    participantWeights: "65 / 25",
    participantFootSizes: "26 / 20",
    specialRequests: "allergy none",
    components: [
      { role: "turtle", date: "2099-08-20", time: "10:00" },
      { role: "night", date: "2099-08-20", time: "19:20" },
    ],
  })
  const rows = adminGas.adminBuildChangedRows_(
    sheet,
    before,
    plan,
    normalized,
    [2, 3],
  )

  assert.equal(rows.length, 2)
  assert.equal(
    rows.reduce(
      (sum, row) => sum + row[adminGas.ADMIN_COLUMNS.TOTAL_PRICE - 1],
      0,
    ),
    18501,
  )
  for (const row of rows) {
    assert.equal(row.length, 45)
    assert.equal(row[adminGas.ADMIN_COLUMNS.PLAN_ID - 1], "C1")
    assert.equal(row[adminGas.ADMIN_COLUMNS.VISITOR_ID - 1], "visitor-keep")
    assert.equal(row[adminGas.ADMIN_COLUMNS.VISIT_ID - 1], "visit-keep")
    assert.equal(row[adminGas.ADMIN_COLUMNS.LINE_USER_ID - 1], "line-keep")
    assert.equal(row[adminGas.ADMIN_COLUMNS.LINE_CONFIRM - 1], "")
    assert.equal(row[adminGas.ADMIN_COLUMNS.LINE_RESULT - 1], "")
    assert.equal(row[adminGas.ADMIN_COLUMNS.PARTICIPANT_AGES - 1], "35 / 8")
    assert.equal(row[adminGas.ADMIN_COLUMNS.PARTICIPANT_HEIGHTS - 1], "170 / 125")
    assert.equal(row[adminGas.ADMIN_COLUMNS.PARTICIPANT_WEIGHTS - 1], "65 / 25")
    assert.equal(row[adminGas.ADMIN_COLUMNS.PARTICIPANT_FOOT_SIZES - 1], "26 / 20")
  }
})

test("existing split reservations infer the correct catalog plan", () => {
  const makeRow = (plan, totalPrice, planId = "") => ({
    plan,
    totalPrice,
    couponDiscount: 0,
    headcount: "大人2名 / 子供1名 / 3歳未満0名",
    planId,
  })

  assert.equal(
    adminGas.adminInferPlanIdFromRows_([
      makeRow("昼夜セット海亀", 24000),
      makeRow("昼夜セットヤシガニ", 24000),
    ]),
    "C2",
  )
  assert.equal(
    adminGas.adminInferPlanIdFromRows_([
      makeRow("まるごと1日セット海亀", 15000),
      makeRow("まるごと1日セットドローンSUP", 14500),
      makeRow("まるごと1日セットヤシガニ", 14500),
    ]),
    "C5",
  )
  assert.equal(
    adminGas.adminInferPlanIdFromRows_([
      makeRow("貸切まるごと1日セット海亀", 23500),
      makeRow("貸切まるごと1日セットドローンSUP", 23500),
      makeRow("貸切まるごと1日セットヤシガニ", 23500),
    ]),
    "C6",
  )
})

test("booking API sends the stable plan id to the reservation GAS", () => {
  assert.match(bookingRouteSource, /bookingNumber,\s*\n\s*planId:\s*plan\.id,/)
})

test("reservation changes keep rollback, history and no automatic LINE send", () => {
  assert.match(adminGasSource, /function adminChangeReservation\(request\)/)
  assert.match(adminGasSource, /adminRestoreFullBookingRows_/)
  assert.match(adminGasSource, /adminRestoreCalendarEvents_/)
  assert.match(adminGasSource, /adminAppendReservationChangeHistory_/)
  assert.match(adminGasSource, /この処理だけではLINEを送信しません/)
})

test("booking deletion uses one confirmation without retyping the booking number", () => {
  const appSource = fs.readFileSync(
    `${root}/apps-script/umigame-reservation-webapp/App.html`,
    "utf8",
  )
  const start = appSource.indexOf("async function deleteBooking")
  const end = appSource.indexOf("async function saveReservationChange", start)
  const deleteSource = appSource.slice(start, end)

  assert.ok(start >= 0)
  assert.ok(end > start)
  assert.equal((deleteSource.match(/window\.confirm\(/g) || []).length, 1)
  assert.doesNotMatch(deleteSource, /window\.prompt\(/)
  assert.match(deleteSource, /confirmed:\s*true/)
  assert.match(adminGasSource, /request\.confirmed !== true/)
  assert.doesNotMatch(adminGasSource, /confirmBookingNumber/)
})

test("calendar lookup uses an exact booking number and finds manually moved events", () => {
  const event = (id, bookingNumber, plan) => ({
    getId: () => id,
    getDescription: () => `予約番号: ${bookingNumber}\nプラン: ${plan}`,
    getTitle: () => plan,
  })
  const target = event("target", "ABC123", "本格ナイトツアー")
  const prefixCollision = event("prefix", "ABC1234", "本格ナイトツアー")
  let rangeSearches = 0
  const calendar = {
    getEventsForDay: () => [],
    getEvents: () => {
      rangeSearches += 1
      return [prefixCollision, target, target]
    },
  }
  const booking = {
    bookingNumber: "ABC123",
    components: [{ date: "2026-08-14", plan: "本格ナイトツアー" }],
  }

  const deletion = adminGas.adminFindCalendarEventsForDeletion_(calendar, booking)
  assert.equal(rangeSearches, 1)
  assert.deepEqual([...deletion.events].map((item) => item.getId()), ["target"])

  const assignments = adminGas.adminFindCalendarAssignments_(calendar, booking)
  assert.equal(assignments.length, 1)
  assert.equal(assignments[0].event.getId(), "target")
})

test("admin startup uses a JSON response, timeout and visible boot diagnostics", () => {
  const appSource = fs.readFileSync(
    `${root}/apps-script/umigame-reservation-webapp/App.html`,
    "utf8",
  )
  const indexSource = fs.readFileSync(
    `${root}/apps-script/umigame-reservation-webapp/Index.html`,
    "utf8",
  )

  assert.match(
    adminGasSource,
    /template\.initialDataJson = adminSafeJsonForHtml_\(adminGetAppData\(\)\)/,
  )
  assert.match(adminGasSource, /function adminGetAppDataJson\(\)/)
  assert.match(indexSource, /id="adminInitialData" type="application\/json"/)
  assert.match(indexSource, /v2026\.08\.14-5/)
  assert.match(appSource, /function readInitialAppData\(\)/)
  assert.match(appSource, /表示完了（HTML埋込）/)
  assert.match(appSource, /window\.location\.reload\(\)/)
  assert.match(appSource, /gas\('adminGetAppDataJson', undefined, 45000\)/)
  assert.match(appSource, /document\.readyState === 'loading'/)
  assert.match(appSource, /Webアプリのデプロイ版と実行履歴/)
  assert.match(appSource, /state\.data = previousData/)
  assert.match(appSource, /if \(!hadUsableData\)/)
  assert.match(appSource, /state\.selectedKey !== requestedKey/)
  assert.match(indexSource, /App\.htmlが読み込まれていません/)
  assert.match(indexSource, /if \(boot\.ready\)/)
  assert.match(indexSource, /__showUmigameAdminFatal/)
})

test("embedded startup JSON cannot break out of its script element", () => {
  const source = "</script><script>alert(1)</script>&\u2028"
  const encoded = adminGas.adminSafeJsonForHtml_({ source })

  assert.doesNotMatch(encoded, /<\/script>/i)
  assert.doesNotMatch(encoded, /</)
  assert.doesNotMatch(encoded, /&/)
  assert.deepEqual(JSON.parse(encoded), { source })
})
