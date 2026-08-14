import assert from "node:assert/strict"
import test from "node:test"

import {
  clearBookingSubmissionId,
  getOrCreateBookingSubmissionId,
} from "./booking-submission.ts"

function memoryStorage() {
  const values = new Map()
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

test("same booking content reuses one submission id and changed content rotates it", async () => {
  globalThis.window = { sessionStorage: memoryStorage() }
  const scope = "test-same-content"
  const firstPayload = { plan: "S1", date: "2099-01-01", guests: [{ age: 30 }] }

  const first = await getOrCreateBookingSubmissionId(scope, firstPayload)
  const retry = await getOrCreateBookingSubmissionId(scope, firstPayload)
  const changed = await getOrCreateBookingSubmissionId(scope, {
    ...firstPayload,
    date: "2099-01-02",
  })

  assert.match(first, /^[0-9a-f-]{36}$/i)
  assert.equal(retry, first)
  assert.notEqual(changed, first)
})

test("successful submission cleanup prevents a completed id from being reused", async () => {
  globalThis.window = { sessionStorage: memoryStorage() }
  const scope = "test-clear"
  const payload = { plan: "S3", date: "2099-02-01" }

  const beforeClear = await getOrCreateBookingSubmissionId(scope, payload)
  clearBookingSubmissionId(scope)
  const afterClear = await getOrCreateBookingSubmissionId(scope, payload)

  assert.notEqual(afterClear, beforeClear)
})
