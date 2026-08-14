import assert from "node:assert/strict"
import test from "node:test"

import { generateBookingNumber, sendToGAS } from "./gas-service.ts"

const payload = {
  bookingNumber: "TEST-BOOKING-001",
  customerName: "Test User",
  customerEmail: "test@example.com",
  planName: "Test Plan",
  selectedDate: "2099-01-01",
  participants: [{ category: "adult" }],
  adultCount: 1,
  childCount: 0,
  under3Count: 0,
  totalPrice: 6500,
}

const failureMessage = "予約システムへの送信に失敗しました"

test("generates one stable booking number for retries of the same submission", () => {
  const first = generateBookingNumber("line-user:test-submission-id")
  const retry = generateBookingNumber("line-user:test-submission-id")
  const different = generateBookingNumber("line-user:another-submission-id")

  assert.match(first, /^W[A-F0-9]{16}$/)
  assert.equal(retry, first)
  assert.notEqual(different, first)
})

test("accepts a JSON response only when success is exactly true", async (t) => {
  t.mock.method(console, "error", () => {})
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ success: true, message: "stored" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  )
  process.env.GAS_BOOKING_URL = "https://example.test/gas"

  const result = await sendToGAS(payload)

  assert.deepEqual(result, {
    success: true,
    message: "予約がシステムに送信されました",
    bookingNumber: payload.bookingNumber,
    timestamp: result.timestamp,
  })
  assert.match(result.timestamp ?? "", /^\d{4}-\d{2}-\d{2}T/)
})

test("retries an ambiguous HTML response once with the same booking number", async (t) => {
  t.mock.method(console, "warn", () => {})
  t.mock.method(console, "error", () => {})
  const requestBodies = []

  t.mock.method(globalThis, "fetch", async (_url, init) => {
    requestBodies.push(JSON.parse(String(init?.body)))

    if (requestBodies.length === 1) {
      return new Response("<html>Apps Script execution error</html>", {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    return new Response(JSON.stringify({ success: true, duplicate: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  })
  process.env.GAS_BOOKING_URL = "https://example.test/gas"

  const result = await sendToGAS(payload)

  assert.equal(requestBodies.length, 2)
  assert.deepEqual(requestBodies[1], requestBodies[0])
  assert.equal(requestBodies[1].bookingNumber, payload.bookingNumber)
  assert.equal(result.success, true)
  assert.equal(result.duplicate, true)
})

const failureCases = [
  ["404 response", () => new Response("not found", { status: 404 })],
  ["500 response", () => new Response("server error", { status: 500 })],
  ["HTML response", () => new Response("<html>ok</html>", { status: 200 })],
  ["empty response", () => new Response("", { status: 200 })],
  ["invalid JSON response", () => new Response("{invalid", { status: 200 })],
  ["success false response", () => new Response(JSON.stringify({ success: false }), { status: 200 })],
  ["missing success response", () => new Response(JSON.stringify({ message: "stored" }), { status: 200 })],
  ["non-object JSON response", () => new Response(JSON.stringify(["success"]), { status: 200 })],
]

test("rejects every response that does not explicitly confirm success", async (t) => {
  process.env.GAS_BOOKING_URL = "https://example.test/gas"

  for (const [name, createResponse] of failureCases) {
    await t.test(name, async (t) => {
      t.mock.method(console, "error", () => {})
      t.mock.method(console, "warn", () => {})
      let requestCount = 0
      t.mock.method(globalThis, "fetch", async () => {
        requestCount += 1
        return createResponse()
      })

      await assert.rejects(() => sendToGAS(payload), {
        message: failureMessage,
      })

      const isAmbiguousResponse = ["HTML response", "empty response", "invalid JSON response"].includes(name)
      assert.equal(requestCount, isAmbiguousResponse ? 2 : 1)
    })
  }
})
