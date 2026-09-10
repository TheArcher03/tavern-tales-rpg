import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACT2_SCENES } from './act2.js'

// Same reasoning as act1.test.ts: Act 2 references Act 1's story flags
// (knowsRaiderCamp) and hands off directly to act3-start, so it's only a
// fully closed graph on its own (no dangling links) — full cross-act
// reachability validation happens in campaign.test.ts.

test('Act 2 starts at act2-start, a narration scene', () => {
  const start = ACT2_SCENES['act2-start']
  assert.ok(start, 'act2-start should exist')
  assert.equal(start.type, 'narration')
})

test('Act 2 offers a shortcut route gated on the Act 1 knowsRaiderCamp flag', () => {
  const start = ACT2_SCENES['act2-start']
  assert.equal(start.type, 'narration')
  if (start.type !== 'narration') return
  const shortcut = start.choices.find((choice) => choice.next === 'act2-shortcut')
  assert.ok(shortcut, 'a choice leading to act2-shortcut should exist')
  assert.deepEqual(shortcut?.condition, { flag: 'knowsRaiderCamp' })
})

test('Act 2 hands off to Act 3 via act2-departure -> act3-start', () => {
  const departure = ACT2_SCENES['act2-departure']
  assert.ok(departure, 'act2-departure should exist')
  assert.equal(departure.type, 'narration')
  if (departure.type !== 'narration') return
  assert.equal(departure.choices.length, 1)
  assert.equal(departure.choices[0].next, 'act3-start')
})

test('Act 2 defines no scene with type "ending" (it hands off, it does not conclude)', () => {
  const endings = Object.values(ACT2_SCENES).filter((scene) => scene.type === 'ending')
  assert.deepEqual(endings, [])
})
