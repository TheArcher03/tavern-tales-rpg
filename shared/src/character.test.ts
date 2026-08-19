import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCharacter } from './character.js'

const validInput = {
  id: 'char-1',
  name: 'Aria',
  raceId: 'human',
  classId: 'fighter',
  backgroundId: 'soldier',
  baseAbilityScores: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
}

test('createCharacter applies racial ability increases', () => {
  const character = createCharacter(validInput)
  // Human: +1 to every ability.
  assert.deepEqual(character.abilityScores, { STR: 16, DEX: 15, CON: 14, INT: 13, WIS: 11, CHA: 9 })
})

test('createCharacter derives HP from class hit die and CON modifier', () => {
  const character = createCharacter(validInput)
  // Fighter hit die 10 + CON modifier (14 -> +2) = 12.
  assert.equal(character.hitPoints.max, 12)
  assert.equal(character.hitPoints.current, 12)
})

test('createCharacter derives AC from DEX modifier', () => {
  const character = createCharacter(validInput)
  // 10 + DEX modifier (15 -> +2) = 12.
  assert.equal(character.armorClass, 12)
})

test('createCharacter sets level 1 proficiency bonus', () => {
  const character = createCharacter(validInput)
  assert.equal(character.proficiencyBonus, 2)
})

test('createCharacter rejects an invalid point-buy allocation', () => {
  assert.throws(
    () => createCharacter({ ...validInput, baseAbilityScores: { STR: 15, DEX: 15, CON: 15, INT: 15, WIS: 15, CHA: 15 } }),
    /invalid point-buy allocation/,
  )
})

test('createCharacter rejects an unknown race id', () => {
  assert.throws(() => createCharacter({ ...validInput, raceId: 'dragonborn' }), /unknown race id/)
})
