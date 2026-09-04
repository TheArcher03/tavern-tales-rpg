import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rollD20, rollDie } from './dice.js'

test('rollD20 maps the low end of the random range to 1', () => {
  assert.equal(rollD20({ random: () => 0 }), 1)
})

test('rollD20 maps the high end of the random range to 20', () => {
  assert.equal(rollD20({ random: () => 0.9999 }), 20)
})

test('rollD20 maps the midpoint to 11', () => {
  assert.equal(rollD20({ random: () => 0.5 }), 11)
})

test('rollDie supports arbitrary die sizes (hit dice)', () => {
  assert.equal(rollDie(8, { random: () => 0 }), 1)
  assert.equal(rollDie(8, { random: () => 0.9999 }), 8)
  assert.equal(rollDie(6, { random: () => 0.5 }), 4)
  assert.equal(rollDie(12, { random: () => 0.5 }), 7)
})
