import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACT1_SCENES } from './act1.js'

// Act 1 no longer validates as a closed graph on its own — its final scene
// (act1-departure) hands off directly to act2-start, a cross-act reference
// that only resolves once ACT1_SCENES and ACT2_SCENES are merged. Full
// structural validation (dangling links, unreachable scenes, ending count)
// now runs against the merged ACTIVE_CAMPAIGN in campaign.test.ts — that's
// the real gate for every future act, not a per-act test.

test('Act 1 starts at act1-start, a narration scene', () => {
  const start = ACT1_SCENES['act1-start']
  assert.ok(start, 'act1-start should exist')
  assert.equal(start.type, 'narration')
})

test('Act 1 hands off to Act 2 via act1-departure -> act2-start', () => {
  const departure = ACT1_SCENES['act1-departure']
  assert.ok(departure, 'act1-departure should exist')
  assert.equal(departure.type, 'narration')
  if (departure.type !== 'narration') return
  assert.equal(departure.choices.length, 1)
  assert.equal(departure.choices[0].next, 'act2-start')
})

test('Act 1 defines no scene with type "ending" (it hands off, it does not conclude)', () => {
  const endings = Object.values(ACT1_SCENES).filter((scene) => scene.type === 'ending')
  assert.deepEqual(endings, [])
})
