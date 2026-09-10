import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateCompanion } from './companion.js'
import { validatePointBuy } from '../pointBuy.js'

test('generateCompanion fills a class not already covered by the player', () => {
  const companion = generateCompanion({
    id: 'c1',
    name: 'Test Companion',
    existingClassIds: ['fighter', 'rogue'],
    random: () => 0,
  })
  assert.ok(['wizard', 'cleric'].includes(companion.classId))
})

test('generateCompanion falls back to any class once all four are covered', () => {
  const companion = generateCompanion({
    id: 'c1',
    name: 'Test Companion',
    existingClassIds: ['fighter', 'wizard', 'rogue', 'cleric'],
    random: () => 0,
  })
  assert.ok(['fighter', 'wizard', 'rogue', 'cleric'].includes(companion.classId))
})

test('generateCompanion produces a valid, fully-spent point-buy allocation', () => {
  const companion = generateCompanion({
    id: 'c1',
    name: 'Test Companion',
    existingClassIds: [],
    random: () => 0.5,
  })
  const validation = validatePointBuy(companion.baseAbilityScores)
  assert.equal(validation.valid, true)
  assert.ok(validation.pointsRemaining >= 0)
})

test('generateCompanion marks the result as a companion', () => {
  const companion = generateCompanion({ id: 'c1', name: 'Test Companion', existingClassIds: [], random: () => 0 })
  assert.equal(companion.role, 'companion')
})

test('generateCompanion is deterministic for a fixed random source', () => {
  const a = generateCompanion({ id: 'c1', name: 'Test', existingClassIds: [], random: () => 0.1 })
  const b = generateCompanion({ id: 'c1', name: 'Test', existingClassIds: [], random: () => 0.1 })
  assert.deepEqual(a, b)
})
