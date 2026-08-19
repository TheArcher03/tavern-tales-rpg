import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validatePointBuy, pointBuyCost } from './pointBuy.js'

test('pointBuyCost matches the SRD cost table', () => {
  assert.equal(pointBuyCost(8), 0)
  assert.equal(pointBuyCost(13), 5)
  assert.equal(pointBuyCost(14), 7)
  assert.equal(pointBuyCost(15), 9)
  assert.throws(() => pointBuyCost(16))
})

test('all-8s allocation is valid and spends nothing', () => {
  const result = validatePointBuy({ STR: 8, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 })
  assert.equal(result.valid, true)
  assert.equal(result.pointsUsed, 0)
  assert.equal(result.pointsRemaining, 27)
})

test('a 27-point allocation is valid and spends the full budget', () => {
  const result = validatePointBuy({ STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 })
  assert.equal(result.valid, true)
  assert.equal(result.pointsUsed, 27)
  assert.equal(result.pointsRemaining, 0)
})

test('all-15s allocation exceeds the budget', () => {
  const result = validatePointBuy({ STR: 15, DEX: 15, CON: 15, INT: 15, WIS: 15, CHA: 15 })
  assert.equal(result.valid, false)
  assert.match(result.errors[0], /exceeding the budget/)
})

test('a score outside 8-15 is rejected', () => {
  const result = validatePointBuy({ STR: 16, DEX: 8, CON: 8, INT: 8, WIS: 8, CHA: 8 })
  assert.equal(result.valid, false)
  assert.match(result.errors[0], /must be between 8 and 15/)
})
