import assert from "node:assert/strict"
import test from "node:test"

import {
  TRACKING_CONSENT_VERSION,
  beginCustomerBookingFunnel,
  completeCustomerBookingFunnel,
  getCustomerTrackingIdentity,
  getTrackingConsentStatus,
  setTrackingConsent,
} from "./customer-tracking.ts"

function storage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  }
}

function browser() {
  const localStorage = storage()
  const sessionStorage = storage()
  return {
    localStorage,
    sessionStorage,
    location: { pathname: "/book" },
    innerWidth: 390,
    dispatchEvent: () => true,
  }
}

test("tracking identities are created only after explicit consent", (t) => {
  const previousWindow = globalThis.window
  const previousNavigator = globalThis.navigator
  globalThis.window = browser()
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { userAgent: "Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1" },
  })
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: previousNavigator })
  })

  assert.equal(getTrackingConsentStatus(), "unknown")
  assert.equal(getCustomerTrackingIdentity(), null)

  setTrackingConsent("accepted")
  assert.equal(getTrackingConsentStatus(), "accepted")
  const funnelId = beginCustomerBookingFunnel()
  const first = getCustomerTrackingIdentity()
  const second = getCustomerTrackingIdentity()

  assert.equal(first.consentVersion, TRACKING_CONSENT_VERSION)
  assert.match(first.visitorId, /^[0-9a-f-]{36}$/i)
  assert.equal(first.visitorId, second.visitorId)
  assert.equal(first.visitId, second.visitId)
  assert.equal(first.bookingFunnelId, funnelId)

  completeCustomerBookingFunnel()
  assert.equal(getCustomerTrackingIdentity().bookingFunnelId, "")
})

test("declining removes every customer tracking identifier", (t) => {
  const previousWindow = globalThis.window
  globalThis.window = browser()
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  })

  setTrackingConsent("accepted")
  beginCustomerBookingFunnel()
  assert.ok(getCustomerTrackingIdentity())

  setTrackingConsent("declined")
  assert.equal(getTrackingConsentStatus(), "declined")
  assert.equal(getCustomerTrackingIdentity(), null)
  assert.equal(globalThis.window.localStorage.getItem("customer_visitor_identity_v1"), null)
  assert.equal(globalThis.window.sessionStorage.getItem("customer_visit_identity_v1"), null)
  assert.equal(globalThis.window.sessionStorage.getItem("customer_booking_funnel_id_v1"), null)
})
