import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveLevelUp } from './leveling.js'

test('resolveLevelUp increments level and derives HP from the hit die roll plus CON modifier', () => {
  const result = resolveLevelUp({
    currentLevel: 1,
    hitDie: 10,
    conModifier: 2,
    random: () => 0.5, // d10 -> 6
  })
  assert.equal(result.newLevel, 2)
  assert.equal(result.hitPointsGained, 8)
})

test('resolveLevelUp floors hit points gained at 1 even with a negative CON modifier', () => {
  const result = resolveLevelUp({
    currentLevel: 1,
    hitDie: 6,
    conModifier: -3,
    random: () => 0, // d6 -> 1, 1 + -3 = -2, floored to 1
  })
  assert.equal(result.hitPointsGained, 1)
})

test('resolveLevelUp steps the proficiency bonus at the right levels', () => {
  const toLevel5 = resolveLevelUp({ currentLevel: 4, hitDie: 8, conModifier: 0, random: () => 0 })
  assert.equal(toLevel5.newProficiencyBonus, 3)
})

test('resolveLevelUp rejects leveling past the maximum', () => {
  assert.throws(
    () => resolveLevelUp({ currentLevel: 20, hitDie: 10, conModifier: 2, random: () => 0.5 }),
    /maximum level/,
  )
})
