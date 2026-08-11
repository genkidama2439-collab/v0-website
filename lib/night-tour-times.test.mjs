import assert from "node:assert/strict"
import test from "node:test"

import { PLANS } from "./data.ts"
import { COMBO_NIGHT_TIMES, NIGHT_TOUR_TIMES } from "./plan-flags.ts"

const expectedTimes = ["19:20", "21:10", "23:20"]

test("night tour departures include the 23:20 third tour", () => {
  assert.deepEqual(NIGHT_TOUR_TIMES, expectedTimes)
  assert.equal(COMBO_NIGHT_TIMES, NIGHT_TOUR_TIMES)
})

test("standalone group and private night tours use the shared departure times", () => {
  for (const planId of ["S3", "S5"]) {
    const plan = PLANS.find((item) => item.id === planId)
    assert.ok(plan, `プランが見つからない: ${planId}`)
    assert.deepEqual(plan.timeTags, expectedTimes)
    assert.deepEqual(plan.provisionalTimes, expectedTimes)
  }
})
