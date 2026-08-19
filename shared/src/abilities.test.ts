import { test } from 'node:test'
import assert from 'node:assert/strict'
import { abilityModifier, proficiencyBonusForLevel } from './abilities.js'

test('abilityModifier matches the SRD table', () => {
  assert.equal(abilityModifier(1), -5)
  assert.equal(abilityModifier(8), -1)
  assert.equal(abilityModifier(10), 0)
  assert.equal(abilityModifier(11), 0)
  assert.equal(abilityModifier(15), 2)
  assert.equal(abilityModifier(20), 5)
})

test('proficiencyBonusForLevel steps every 4 levels', () => {
  assert.equal(proficiencyBonusForLevel(1), 2)
  assert.equal(proficiencyBonusForLevel(4), 2)
  assert.equal(proficiencyBonusForLevel(5), 3)
  assert.equal(proficiencyBonusForLevel(8), 3)
  assert.equal(proficiencyBonusForLevel(9), 4)
  assert.equal(proficiencyBonusForLevel(13), 5)
  assert.equal(proficiencyBonusForLevel(17), 6)
  assert.equal(proficiencyBonusForLevel(20), 6)
})

test('proficiencyBonusForLevel rejects out-of-range levels', () => {
  assert.throws(() => proficiencyBonusForLevel(0))
  assert.throws(() => proficiencyBonusForLevel(21))
})
