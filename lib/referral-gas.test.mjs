import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import vm from "node:vm"

const gasSource = fs.readFileSync(
  new URL("../apps-script/umigame-reservation-admin/Code.gs", import.meta.url),
  "utf8",
)

class MemoryRange {
  constructor(sheet, row, column, rowCount = 1, columnCount = 1) {
    this.sheet = sheet
    this.row = row - 1
    this.column = column - 1
    this.rowCount = rowCount
    this.columnCount = columnCount
  }

  getValues() {
    return Array.from({ length: this.rowCount }, (_, rowOffset) =>
      Array.from({ length: this.columnCount }, (_, columnOffset) =>
        this.sheet.data[this.row + rowOffset]?.[this.column + columnOffset] ?? "",
      ),
    )
  }

  getDisplayValues() {
    return this.getValues().map((row) => row.map((value) => String(value ?? "")))
  }

  getValue() {
    return this.getValues()[0][0]
  }

  setValues(values) {
    values.forEach((valuesRow, rowOffset) => {
      const targetRow = this.row + rowOffset
      while (this.sheet.data.length <= targetRow) this.sheet.data.push([])
      valuesRow.forEach((value, columnOffset) => {
        this.sheet.data[targetRow][this.column + columnOffset] = value
      })
    })
    return this
  }

  setValue(value) {
    return this.setValues([[value]])
  }

  clearContent() {
    for (let rowOffset = 0; rowOffset < this.rowCount; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < this.columnCount; columnOffset += 1) {
        const targetRow = this.row + rowOffset
        while (this.sheet.data.length <= targetRow) this.sheet.data.push([])
        this.sheet.data[targetRow][this.column + columnOffset] = ""
      }
    }
    return this
  }

  clearDataValidations() { return this }
  setDataValidation() { return this }
  setFontWeight() { return this }
  setBackground() { return this }
}

class MemorySheet {
  constructor(name, data = [], maxColumns = 49) {
    this.name = name
    this.data = data.map((row) => [...row])
    this.maxColumns = maxColumns
    this.maxRows = Math.max(this.data.length, 20)
  }

  getName() { return this.name }
  getMaxColumns() { return this.maxColumns }
  getMaxRows() { return this.maxRows }
  getLastRow() {
    for (let index = this.data.length - 1; index >= 0; index -= 1) {
      if (this.data[index].some((value) => value !== "" && value !== null && value !== undefined)) {
        return index + 1
      }
    }
    return 0
  }
  getRange(row, column, rowCount = 1, columnCount = 1) {
    return new MemoryRange(this, row, column, rowCount, columnCount)
  }
  insertColumnsAfter(_afterColumn, howMany) { this.maxColumns += howMany }
  insertRowsAfter(_afterRow, howMany) { this.maxRows += howMany }
  setFrozenRows() {}
}

class MemorySpreadsheet {
  constructor(sheets = []) {
    this.sheets = new Map(sheets.map((sheet) => [sheet.getName(), sheet]))
  }
  getSheetByName(name) { return this.sheets.get(name) || null }
  insertSheet(name) {
    const sheet = new MemorySheet(name, [], 26)
    this.sheets.set(name, sheet)
    return sheet
  }
  toast() {}
}

function loadGas() {
  let spreadsheet = null
  const properties = new Map()
  const propertyStore = {
    getProperty(key) { return properties.get(key) || null },
    setProperty(key, value) { properties.set(key, String(value)) },
    deleteProperty(key) { properties.delete(key) },
  }
  const sandbox = {
    console,
    Logger: { log() {} },
    SpreadsheetApp: {
      flush() {},
      getActiveSpreadsheet: () => spreadsheet,
      getUi: () => ({ createMenu: () => ({ addItem() { return this }, addSeparator() { return this }, addToUi() {} }) }),
    },
    PropertiesService: {
      getScriptProperties: () => propertyStore,
      getDocumentProperties: () => null,
    },
    LockService: {
      getScriptLock: () => ({ waitLock() {}, releaseLock() {}, tryLock: () => true }),
    },
    CalendarApp: {},
    GmailApp: {},
    UrlFetchApp: {},
    ContentService: {},
  }
  vm.createContext(sandbox)
  vm.runInContext(gasSource, sandbox)

  return {
    gas: sandbox,
    propertyStore,
    setSpreadsheet(value) { spreadsheet = value },
  }
}

function bookingRow(gas, bookingNumber, planId, rowAmount, timestamp = new Date()) {
  const row = Array(gas.HEADERS.length).fill("")
  row[gas.COLUMNS.TIMESTAMP - 1] = timestamp
  row[gas.COLUMNS.BOOKING_NUM - 1] = bookingNumber
  row[gas.COLUMNS.DATE - 1] = "2099-08-20"
  row[gas.COLUMNS.PLAN - 1] = `${planId} component`
  row[gas.COLUMNS.TOTAL_PRICE - 1] = rowAmount
  row[gas.COLUMNS.PLAN_ID - 1] = planId
  return row
}

function fixture({
  bookingNumber = "REF-BOOKING-1",
  planId = "S1",
  rowCount = 1,
  totalPrice = 20_000,
  partnerActive = true,
  partnerMethod = "PERCENTAGE",
  partnerRate = 50,
  participantCount = 2,
  ruleRows = [],
  referralCode = "kaita",
  couponDiscount = 0,
} = {}) {
  const runtime = loadGas()
  const { gas } = runtime
  const perRow = Math.floor(totalPrice / rowCount)
  const bookingRows = Array.from({ length: rowCount }, (_, index) =>
    bookingRow(
      gas,
      bookingNumber,
      planId,
      index === rowCount - 1 ? totalPrice - perRow * (rowCount - 1) : perRow,
    ),
  )
  const bookingSheet = new MemorySheet("予約一覧", [[...gas.HEADERS], ...bookingRows])
  const partnerSheet = new MemorySheet("紹介者マスタ", [
    [...gas.REFERRAL_PARTNER_HEADERS],
    ["kaita", "かいた君", partnerActive, partnerMethod, partnerRate, "", "", ""],
  ])
  const ruleSheet = new MemorySheet("紹介報酬ルール", [
    [...gas.REFERRAL_RULE_HEADERS],
    ...ruleRows,
  ])
  const outcomeSheet = new MemorySheet("紹介成果", [[...gas.REFERRAL_OUTCOME_HEADERS]])
  const spreadsheet = new MemorySpreadsheet([bookingSheet, partnerSheet, ruleSheet, outcomeSheet])

  runtime.setSpreadsheet(spreadsheet)
  runtime.propertyStore.setProperty(gas.BOOKING_SCHEMA_VERSION_PROPERTY, gas.BOOKING_SCHEMA_VERSION)

  const data = {
    bookingNumber,
    planId,
    selectedDate: "2099-08-20",
    totalPrice,
    couponDiscount,
    participants: Array.from({ length: participantCount }, () => ({ category: "adult" })),
    referral: {
      referralCode,
      campaign: "instagram",
      acquiredAt: new Date().toISOString(),
    },
  }

  return { ...runtime, spreadsheet, bookingSheet, partnerSheet, ruleSheet, outcomeSheet, data }
}

test("kaita 50% uses final post-coupon revenue and assigns an odd yen to the company", () => {
  const even = fixture({ totalPrice: 20_000, couponDiscount: 2_000 })
  const evenResult = even.gas.referralProcessBooking_(even.data)
  const evenOutcome = even.outcomeSheet.data[1]

  assert.equal(evenResult.reward, 10_000)
  assert.equal(evenResult.companyShare, 10_000)
  assert.equal(evenOutcome[even.gas.REFERRAL_OUTCOME_COLUMNS.REVENUE - 1], 20_000)
  assert.equal(evenOutcome[even.gas.REFERRAL_OUTCOME_COLUMNS.PARTNER_REWARD - 1], 10_000)

  const odd = fixture({ bookingNumber: "REF-ODD", totalPrice: 13_001 })
  const oddResult = odd.gas.referralProcessBooking_(odd.data)
  assert.equal(oddResult.reward, 6_500)
  assert.equal(oddResult.companyShare, 6_501)
})

test("inactive and nonexistent partner codes produce zero reward", () => {
  const inactive = fixture({ bookingNumber: "REF-INACTIVE", partnerActive: false })
  const missing = fixture({ bookingNumber: "REF-MISSING", referralCode: "fake-user" })

  assert.deepEqual(
    { ...inactive.gas.referralProcessBooking_(inactive.data) },
    { valid: false, reward: 0, reason: "INVALID_OR_INACTIVE_CODE" },
  )
  assert.deepEqual(
    { ...missing.gas.referralProcessBooking_(missing.data) },
    { valid: false, reward: 0, reason: "INVALID_OR_INACTIVE_CODE" },
  )
  assert.equal(inactive.outcomeSheet.getLastRow(), 1)
  assert.equal(missing.outcomeSheet.getLastRow(), 1)
})

test("a partner outside its reception-period window produces zero reward", () => {
  const item = fixture({ bookingNumber: "REF-FUTURE" })
  item.partnerSheet.data[1][5] = "2099-01-01"

  assert.deepEqual(
    { ...item.gas.referralProcessBooking_(item.data) },
    { valid: false, reward: 0, reason: "INVALID_OR_INACTIVE_CODE" },
  )
  assert.equal(item.outcomeSheet.getLastRow(), 1)
})

test("plan-specific reward overrides the partner default", () => {
  const scopedRule = ["kaita", "S3", "PERCENTAGE", 40, "", "", true, ""]
  const scoped = fixture({
    bookingNumber: "REF-S3",
    planId: "S3",
    totalPrice: 13_001,
    ruleRows: [scopedRule],
  })
  const otherPlan = fixture({
    bookingNumber: "REF-S1",
    planId: "S1",
    totalPrice: 13_001,
    ruleRows: [scopedRule],
  })

  assert.equal(scoped.gas.referralProcessBooking_(scoped.data).reward, 5_200)
  assert.equal(otherPlan.gas.referralProcessBooking_(otherPlan.data).reward, 6_500)
})

test("fixed and per-participant master rewards are clamped to booking revenue", () => {
  const fixed = fixture({
    bookingNumber: "REF-FIXED",
    totalPrice: 800,
    partnerMethod: "FIXED_BOOKING",
    partnerRate: 1_000,
  })
  const perPerson = fixture({
    bookingNumber: "REF-PER-PERSON",
    totalPrice: 1_200,
    partnerMethod: "PER_PARTICIPANT",
    partnerRate: 500,
    participantCount: 3,
  })
  const fixedResult = fixed.gas.referralProcessBooking_(fixed.data)
  const perPersonResult = perPerson.gas.referralProcessBooking_(perPerson.data)

  assert.equal(fixedResult.reward, 800)
  assert.equal(fixedResult.companyShare, 0)
  assert.equal(perPersonResult.reward, 1_200)
  assert.equal(perPersonResult.companyShare, 0)
})

test("two-row C3 and three-row C5/C6 reservations each create exactly one outcome", () => {
  for (const [planId, rowCount] of [["C3", 2], ["C5", 3], ["C6", 3]]) {
    const item = fixture({
      bookingNumber: `REF-${planId}`,
      planId,
      rowCount,
      totalPrice: 20_001,
    })

    const first = item.gas.referralProcessBooking_(item.data)
    const retry = item.gas.referralProcessBooking_(item.data)

    assert.equal(first.outcomeCreated, true)
    assert.equal(retry.outcomeCreated, false)
    assert.equal(item.outcomeSheet.getLastRow(), 2)
    assert.equal(
      item.bookingSheet.data.slice(1, rowCount + 1).every(
        (row) => row[item.gas.COLUMNS.REFERRAL_CODE - 1] === "kaita",
      ),
      true,
    )
  }
})

test("a concurrent retry uses the outcome snapshot that won the booking-number upsert", () => {
  const item = fixture({ bookingNumber: "REF-RACE" })
  const acquiredAt = new Date()

  item.gas.referralUpsertOutcome_ = (sheet, data, acceptedAt) => {
    sheet.data.push([
      acceptedAt,
      data.bookingNumber,
      data.selectedDate,
      "ryoya",
      "りょうや",
      data.planId,
      20_000,
      "PERCENTAGE",
      30,
      6_000,
      14_000,
      "hotel",
      acquiredAt,
      "未確定",
      "",
      "未払い",
      "",
      "concurrent winner",
    ])
    return false
  }

  const result = item.gas.referralProcessBooking_(item.data)

  assert.equal(result.outcomeCreated, false)
  assert.equal(result.reward, 6_000)
  assert.equal(result.companyShare, 14_000)
  assert.equal(item.bookingSheet.data[1][item.gas.COLUMNS.REFERRAL_CODE - 1], "ryoya")
  assert.equal(item.bookingSheet.data[1][item.gas.COLUMNS.REFERRAL_NAME - 1], "りょうや")
})

test("an existing outcome remains an immutable snapshot after the rate changes", () => {
  const item = fixture({ bookingNumber: "REF-SNAPSHOT", partnerRate: 50 })
  item.gas.referralProcessBooking_(item.data)
  const original = [...item.outcomeSheet.data[1]]

  item.partnerSheet.data[1][4] = 30
  item.data.referral.referralCode = "ryoya"
  item.gas.referralProcessBooking_(item.data)

  assert.deepEqual(item.outcomeSheet.data[1], original)
  assert.equal(item.outcomeSheet.data[1][item.gas.REFERRAL_OUTCOME_COLUMNS.REWARD_VALUE - 1], 50)
  assert.equal(item.outcomeSheet.data[1][item.gas.REFERRAL_OUTCOME_COLUMNS.PARTNER_REWARD - 1], 10_000)
  assert.equal(item.bookingSheet.data[1][item.gas.COLUMNS.REFERRAL_CODE - 1], "kaita")
})

test("referral exceptions are contained and never replace the booking response path", () => {
  const item = fixture()
  item.gas.referralProcessBooking_ = () => { throw new Error("referral sheet unavailable") }

  assert.deepEqual(
    { ...item.gas.referralProcessBookingSafely_(item.data) },
    { valid: false, reward: 0, reason: "PROCESSING_ERROR" },
  )
  assert.match(
    gasSource,
    /var response = REFERRAL_ORIGINAL_DO_POST\(e\);[\s\S]*?referralProcessBookingSafely_\(data\);[\s\S]*?return response;/,
  )
})

test("setup is idempotent and never overwrites the initial kaita master row", () => {
  const runtime = loadGas()
  const { gas } = runtime
  const bookingSheet = new MemorySheet("予約一覧", [[...gas.HEADERS]])
  const spreadsheet = new MemorySpreadsheet([bookingSheet])
  runtime.setSpreadsheet(spreadsheet)
  runtime.propertyStore.setProperty(gas.BOOKING_SCHEMA_VERSION_PROPERTY, gas.BOOKING_SCHEMA_VERSION)

  const first = gas.setupReferralProgram()
  const master = spreadsheet.getSheetByName("紹介者マスタ")
  const original = [...master.data[1]]
  const second = gas.setupReferralProgram()

  assert.equal(first.partnerCreated, true)
  assert.equal(second.partnerCreated, false)
  assert.equal(master.getLastRow(), 2)
  assert.deepEqual(master.data[1], original)
  assert.deepEqual(master.data[1].slice(0, 5), ["kaita", "かいた君", true, "PERCENTAGE", 50])
})

test("setup refuses to overwrite an unexpected existing referral sheet", () => {
  const runtime = loadGas()
  const { gas } = runtime
  const bookingSheet = new MemorySheet("予約一覧", [[...gas.HEADERS]])
  const conflictingMaster = new MemorySheet("紹介者マスタ", [
    ["既存の独自ヘッダー", "保持する値"],
    ["existing", "do-not-overwrite"],
  ])
  const spreadsheet = new MemorySpreadsheet([bookingSheet, conflictingMaster])
  const before = conflictingMaster.data.map((row) => [...row])
  runtime.setSpreadsheet(spreadsheet)
  runtime.propertyStore.setProperty(gas.BOOKING_SCHEMA_VERSION_PROPERTY, gas.BOOKING_SCHEMA_VERSION)

  assert.throws(() => gas.setupReferralProgram(), /自動上書きしません/)
  assert.deepEqual(conflictingMaster.data, before)
})
