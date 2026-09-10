import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCharacter } from '../character.js'
import {
  applyEffect,
  isChoiceAvailable,
  resolveChoice,
  resolveEncounterChoice,
} from './engine.js'
import { createPartyState } from './partyState.js'
import type { EncounterChoice } from './types.js'

function testCharacter(id: string, overrides: Partial<Parameters<typeof createCharacter>[0]> = {}) {
  return createCharacter({
    id,
    name: `Character ${id}`,
    raceId: 'human',
    classId: 'fighter',
    backgroundId: 'soldier',
    baseAbilityScores: { STR: 15, DEX: 14, CON: 13, INT: 12, WIS: 10, CHA: 8 },
    ...overrides,
  })
}

function testParty() {
  return createPartyState(
    [testCharacter('pc1'), testCharacter('pc2'), testCharacter('companion1'), testCharacter('companion2')],
    'scene-1',
  )
}

test('applyEffect grantGold adds to the shared pool', () => {
  const { party } = applyEffect(testParty(), { type: 'grantGold', amount: 15 })
  assert.equal(party.sharedGold, 15)
})

test('applyEffect hitPointChange clamps at 0 and at max', () => {
  const party = testParty()
  const damaged = applyEffect(party, { type: 'hitPointChange', target: 'pc1', delta: -999, reason: 'test' }).party
  assert.equal(damaged.members[0].hitPoints.current, 0)
  const healed = applyEffect(damaged, { type: 'hitPointChange', target: 'pc1', delta: 999, reason: 'test' }).party
  assert.equal(healed.members[0].hitPoints.current, healed.members[0].hitPoints.max)
})

test('applyEffect hitPointChange with target "party" affects all four members', () => {
  const { party } = applyEffect(testParty(), { type: 'hitPointChange', target: 'party', delta: -1, reason: 'test' })
  for (const member of party.members) {
    assert.equal(member.hitPoints.current, member.hitPoints.max - 1)
  }
})

test('applyEffect levelUp increases level and HP for the targeted member only', () => {
  const party = testParty()
  const { party: next } = applyEffect(party, { type: 'levelUp', target: 'pc1' }, () => 0.5)
  assert.equal(next.members[0].level, 2)
  assert.equal(next.members[1].level, 1)
  assert.ok(next.members[0].hitPoints.max > party.members[0].hitPoints.max)
})

test('applyEffect grantCurse and removeCurse round-trip', () => {
  const curse = { id: 'c1', name: 'Withered Hand', description: 'Test curse' }
  const cursed = applyEffect(testParty(), { type: 'grantCurse', target: 'pc1', curse }).party
  assert.equal(cursed.members[0].curses.length, 1)
  const cleansed = applyEffect(cursed, { type: 'removeCurse', target: 'pc1', curseId: 'c1' }).party
  assert.equal(cleansed.members[0].curses.length, 0)
})

test('isChoiceAvailable respects story flags', () => {
  const party = { ...testParty(), storyFlags: { metTheHermit: true } }
  assert.equal(isChoiceAvailable(party, undefined), true)
  assert.equal(isChoiceAvailable(party, { flag: 'metTheHermit' }), true)
  assert.equal(isChoiceAvailable(party, { flag: 'foundTheKey' }), false)
  assert.equal(isChoiceAvailable(party, { flag: 'foundTheKey', equals: false }), true)
})

test('resolveChoice applies effects and returns the next scene id', () => {
  const outcome = resolveChoice(testParty(), {
    label: 'Take the gold',
    next: 'scene-2',
    effects: [{ type: 'grantGold', amount: 10 }],
  })
  assert.equal(outcome.nextSceneId, 'scene-2')
  assert.equal(outcome.party.sharedGold, 10)
  assert.equal(outcome.logs.length, 1)
})

test('resolveEncounterChoice branches to successNext on a passing roll', () => {
  const choice: EncounterChoice = {
    label: 'Force the door',
    actor: 'pc1',
    ability: 'STR',
    dc: 5,
    successNext: 'won',
    failureNext: 'lost',
    successEffects: [{ type: 'grantGold', amount: 5 }],
  }
  const outcome = resolveEncounterChoice(testParty(), choice, () => 0.9)
  assert.equal(outcome.success, true)
  assert.equal(outcome.nextSceneId, 'won')
  assert.equal(outcome.party.sharedGold, 5)
})

test('resolveEncounterChoice branches to failureNext on a failing roll', () => {
  const choice: EncounterChoice = {
    label: 'Force the door',
    actor: 'pc1',
    ability: 'STR',
    dc: 30,
    successNext: 'won',
    failureNext: 'lost',
    failureEffects: [{ type: 'hitPointChange', target: 'pc1', delta: -2, reason: 'the door slams back' }],
  }
  const outcome = resolveEncounterChoice(testParty(), choice, () => 0)
  assert.equal(outcome.success, false)
  assert.equal(outcome.nextSceneId, 'lost')
  assert.equal(outcome.party.members[0].hitPoints.current, outcome.party.members[0].hitPoints.max - 2)
})
