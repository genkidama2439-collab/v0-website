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
      flush() {},
      getActiveSpreadsheet: () => ({ toast() {} }),
      getUi: () => ({ createMenu: () => ({ addItem: () => ({ addToUi() {} }) }) }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, deleteProperty() {} }),
      getDocumentProperties: () => null,
    },
    LockService: {
      getScriptLock: () => ({ waitLock() {}, releaseLock() {} }),
    },
    CalendarApp: {},
    GmailApp: {},
    UrlFetchApp: {},
    ContentService: {},
  }
  vm.createContext(sandbox)
  vm.runInContext(readFileSync(GAS_PATH, "utf8"), sandbox)
  return sandbox
}

function fakeSheet(initialRows = 8) {
  const columnCount = 49
  const cells = Array.from({ length: initialRows }, () => Array(columnCount).fill(""))
  const validations = Array.from({ length: initialRows }, () => Array(columnCount).fill(false))
  let validationClears = 0

  const range = (row, column, rowCount = 1, requestedColumnCount = 1) => ({
    getDisplayValues() {
      return cells
        .slice(row - 1, row - 1 + rowCount)
        .map((values) => values.slice(column - 1, column - 1 + requestedColumnCount).map(String))
    },
    getValues() {
      return cells
        .slice(row - 1, row - 1 + rowCount)
        .map((values) => values.slice(column - 1, column - 1 + requestedColumnCount))
    },
    setValues(values) {
      values.forEach((valuesRow, rowOffset) => {
        valuesRow.forEach((value, columnOffset) => {
          const targetRow = row - 1 + rowOffset
          const targetColumn = column - 1 + columnOffset
          if (validations[targetRow][targetColumn] && typeof value !== "boolean" && value !== "") {
            throw new Error(`validation rejected row ${targetRow + 1} column ${targetColumn + 1}`)
          }
        })
      })
      values.forEach((valuesRow, rowOffset) => {
        valuesRow.forEach((value, columnOffset) => {
          cells[row - 1 + rowOffset][column - 1 + columnOffset] = value
        })
      })
      return this
    },
    clearDataValidations() {
      validationClears += 1
      for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < requestedColumnCount; columnOffset += 1) {
          validations[row - 1 + rowOffset][column - 1 + columnOffset] = false
        }
      }
      return this
    },
    clearContent() {
      for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
        for (let columnOffset = 0; columnOffset < requestedColumnCount; columnOffset += 1) {
          cells[row - 1 + rowOffset][column - 1 + columnOffset] = ""
        }
      }
      return this
    },
  })

  return {
    cells,
    validations,
    get validationClears() { return validationClears },
    getMaxRows: () => cells.length,
    getRange: range,
    insertRowsAfter(afterRow, howMany) {
      const addedCells = Array.from({ length: howMany }, () => Array(columnCount).fill(""))
      const addedValidations = Array.from({ length: howMany }, () =>
        validations[afterRow - 1].slice()
      )
      cells.splice(afterRow, 0, ...addedCells)
      validations.splice(afterRow, 0, ...addedValidations)
    },
  }
}

function bookingRow(bookingNumber, time, plan, amount, email = "guest@example.com") {
  const values = Array(49).fill("")
  values[1] = bookingNumber
  values[3] = time
  values[5] = plan
  values[6] = amount
  values[21] = email
  values[44] = "C5"
  return values
}

test("stale checkbox validation in the email column is removed before a three-row write", () => {
  const gas = loadReservationGas()
  const sheet = fakeSheet(3)
  sheet.validations.forEach((row) => { row[21] = true })
  const rows = [
    bookingRow("BOOK-3", "09:00", "まるごと1日セット海亀", 5333),
    bookingRow("BOOK-3", "10:30", "まるごと1日セットドローンSUP", 5333),
    bookingRow("BOOK-3", "19:20", "まるごと1日セットヤシガニ", 5334),
  ]

  assert.equal(gas.writeBookingRows_(sheet, rows), true)
  assert.equal(sheet.validationClears, 1)
  assert.deepEqual(
    sheet.cells.slice(1, 4).map((row) => [row[1], row[5], row[6], row[21]]),
    rows.map((row) => [row[1], row[5], row[6], row[21]])
  )
})

test("an incomplete existing booking is never reported as a successful duplicate", () => {
  const gas = loadReservationGas()
  const sheet = fakeSheet()
  const rows = [
    bookingRow("BOOK-PARTIAL", "09:00", "まるごと1日セット海亀", 5333),
    bookingRow("BOOK-PARTIAL", "10:30", "まるごと1日セットドローンSUP", 5333),
    bookingRow("BOOK-PARTIAL", "19:20", "まるごと1日セットヤシガニ", 5334),
  ]
  sheet.cells[1] = rows[0].slice()

  assert.throws(
    () => gas.writeBookingRows_(sheet, rows),
    /既存1行 \/ 必要3行/
  )
})

test("a complete retry remains idempotent", () => {
  const gas = loadReservationGas()
  const sheet = fakeSheet()
  const rows = [
    bookingRow("BOOK-DUPLICATE", "09:00", "まるごと1日セット海亀", 5333),
    bookingRow("BOOK-DUPLICATE", "10:30", "まるごと1日セットドローンSUP", 5333),
    bookingRow("BOOK-DUPLICATE", "19:20", "まるごと1日セットヤシガニ", 5334),
  ]
  rows.forEach((row, index) => { sheet.cells[index + 1] = row.slice() })

  assert.equal(gas.writeBookingRows_(sheet, rows), false)
})
