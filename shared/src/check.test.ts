import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCheck } from './check.js'

test('resolveCheck adds ability modifier but not proficiency when not proficient', () => {
  // abilityScore 16 -> modifier +3. roll fixed at 10 (random 0.45 -> floor(9)+1=10).
  const result = resolveCheck({
    abilityScore: 16,
    dc: 14,
    proficient: false,
    proficiencyBonus: 2,
    random: () => 0.45,
  })
  assert.equal(result.roll, 10)
  assert.equal(result.modifier, 3)
  assert.equal(result.total, 13)
  assert.equal(result.success, false)
})

test('resolveCheck adds proficiency bonus when proficient', () => {
  const result = resolveCheck({
    abilityScore: 16,
    dc: 14,
    proficient: true,
    proficiencyBonus: 2,
    random: () => 0.45,
  })
  assert.equal(result.modifier, 5)
  assert.equal(result.total, 15)
  assert.equal(result.success, true)
})

test('resolveCheck fails when total falls short of the DC', () => {
  const result = resolveCheck({
    abilityScore: 10,
    dc: 11,
    proficient: false,
    proficiencyBonus: 2,
    random: () => 0, // roll 1, modifier 0, total 1
  })
  assert.equal(result.total, 1)
  assert.equal(result.success, false)
})

test('resolveCheck treats total === dc as success', () => {
  const result = resolveCheck({
    abilityScore: 10, // modifier 0
    dc: 10,
    proficient: false,
    proficiencyBonus: 2,
    random: () => 0.45, // roll 10
  })
  assert.equal(result.total, 10)
  assert.equal(result.success, true)
})
