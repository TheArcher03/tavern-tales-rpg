import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCharacter } from '../character.js'
import {
  applyAbilityIncrease,
  applyEffect,
  autoAssignCompanionAbilityIncrease,
  isChoiceAvailable,
  resolveChoice,
  resolveEncounterChoice,
  resolvePurchase,
  useItem,
} from './engine.js'
import { createPartyState } from './partyState.js'
import type { EncounterChoice, ShopOffer } from './types.js'

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

test('a hitPointChange effect that reduces HP to 0 marks the member dead and reports the death', () => {
  const party = testParty()
  const { party: next, deaths } = applyEffect(party, { type: 'hitPointChange', target: 'pc1', delta: -999, reason: 'test' })
  assert.equal(next.members[0].status, 'dead')
  assert.deepEqual(deaths, [next.members[0].name])
})

test('a hitPointChange effect that only damages (not to 0) does not mark anyone dead', () => {
  const { party: next, deaths } = applyEffect(testParty(), { type: 'hitPointChange', target: 'pc1', delta: -1, reason: 'test' })
  assert.equal(next.members[0].status, 'alive')
  assert.equal(deaths, undefined)
})

test('healing a dead member does not resurrect them (status stays dead once set)', () => {
  const dead = applyEffect(testParty(), { type: 'hitPointChange', target: 'pc1', delta: -999, reason: 'test' }).party
  const healed = applyEffect(dead, { type: 'hitPointChange', target: 'pc1', delta: 999, reason: 'test' }).party
  assert.equal(healed.members[0].status, 'dead')
})

test('resolveEncounterChoice substitutes a living member when the authored actor is dead', () => {
  const alive = testParty()
  // pc1 (STR 15, mod +2) dies; pc2 also has STR 15 here, so bump companion1's
  // STR so the substitution is unambiguous and verifiable.
  const withDeadPc1 = applyEffect(alive, { type: 'hitPointChange', target: 'pc1', delta: -999, reason: 'test' }).party
  const boosted = {
    ...withDeadPc1,
    members: withDeadPc1.members.map((member, index) =>
      index === 2 ? { ...member, abilityModifiers: { ...member.abilityModifiers, STR: 10 } } : member,
    ) as typeof withDeadPc1.members,
  }
  const choice: EncounterChoice = {
    label: 'Force the door',
    actor: 'pc1',
    ability: 'STR',
    dc: 5,
    successNext: 'won',
    failureNext: 'lost',
  }
  const outcome = resolveEncounterChoice(boosted, choice, () => 0.9)
  assert.match(outcome.checkLog, /companion1/i)
})

test('applyAbilityIncrease bumps the ability, recomputes the modifier, and caps at 20', () => {
  const party = testParty()
  const bumped = applyAbilityIncrease(party, 'pc1', 'STR')
  assert.equal(bumped.members[0].abilityScores.STR, party.members[0].abilityScores.STR + 1)
  assert.equal(bumped.members[0].abilityModifiers.STR, Math.floor((bumped.members[0].abilityScores.STR - 10) / 2))

  const atCap = { ...party, members: party.members.map((m, i) => (i === 0 ? { ...m, abilityScores: { ...m.abilityScores, STR: 20 } } : m)) as typeof party.members }
  const stillCapped = applyAbilityIncrease(atCap, 'pc1', 'STR')
  assert.equal(stillCapped.members[0].abilityScores.STR, 20)
})

test('applyAbilityIncrease recomputes armor class when the ability is DEX', () => {
  const party = testParty()
  const bumped = applyAbilityIncrease(party, 'pc1', 'DEX')
  assert.equal(bumped.members[0].armorClass, 10 + bumped.members[0].abilityModifiers.DEX)
  assert.notEqual(bumped.members[0].armorClass, party.members[0].armorClass)
})

test('applyAbilityIncrease leaves armor class alone for non-DEX abilities', () => {
  const party = testParty()
  const bumped = applyAbilityIncrease(party, 'pc1', 'STR')
  assert.equal(bumped.members[0].armorClass, party.members[0].armorClass)
})

test('autoAssignCompanionAbilityIncrease picks from the class priority list, deterministically for a fixed random', () => {
  const fighter = testCharacter('c1', { classId: 'fighter' })
  const ability = autoAssignCompanionAbilityIncrease(fighter, () => 0)
  assert.ok(['STR', 'CON'].includes(ability))
  const abilityAgain = autoAssignCompanionAbilityIncrease(fighter, () => 0)
  assert.equal(ability, abilityAgain)
})

test('resolvePurchase deducts gold and grants the item on success', () => {
  const party = { ...testParty(), sharedGold: 20 }
  const offer: ShopOffer = { id: 'potion', name: 'Healing Draught', description: 'Heals wounds.', cost: 10, item: { id: 'potion', name: 'Healing Draught', description: 'Heals wounds.' } }
  const { party: next, success } = resolvePurchase(party, offer)
  assert.equal(success, true)
  assert.equal(next.sharedGold, 10)
  assert.equal(next.sharedTreasure.length, 1)
})

test('resolvePurchase refuses and leaves the party unchanged when unaffordable', () => {
  const party = { ...testParty(), sharedGold: 5 }
  const offer: ShopOffer = { id: 'potion', name: 'Healing Draught', description: 'Heals wounds.', cost: 10 }
  const { party: next, success } = resolvePurchase(party, offer)
  assert.equal(success, false)
  assert.equal(next.sharedGold, 5)
  assert.equal(next.sharedTreasure.length, 0)
})

test('useItem removes exactly one matching entry, not every entry sharing that id', () => {
  const usableItem = {
    id: 'draught',
    name: 'Healing Draught',
    description: 'Heals wounds.',
    usable: { effects: [{ type: 'hitPointChange' as const, target: 'pc1' as const, delta: 5, reason: 'the draught takes effect' }], useNarration: 'You drink the draught.' },
  }
  const party = { ...testParty(), sharedTreasure: [usableItem, usableItem] }
  const result = useItem(party, 'draught')
  assert.ok(result)
  assert.equal(result?.party.sharedTreasure.length, 1)
})

test('useItem returns null for a non-usable or missing item', () => {
  const flavorItem = { id: 'trinket', name: 'Trinket', description: 'Just a trinket.' }
  const party = { ...testParty(), sharedTreasure: [flavorItem] }
  assert.equal(useItem(party, 'trinket'), null)
  assert.equal(useItem(party, 'does-not-exist'), null)
})
