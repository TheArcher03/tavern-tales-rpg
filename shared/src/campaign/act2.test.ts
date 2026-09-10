import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACT2_SCENES } from './act2.js'

// Same reasoning as act1.test.ts: Act 2 references act1's story flags
// (knowsRaiderCamp) and hands off to a temporary act2-end stub, so it's
// only a fully closed graph on its own (no dangling links) — full
// cross-act reachability validation happens in campaign.test.ts.

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

test('Act 2 ends at the temporary act2-end stub', () => {
  const endings = Object.values(ACT2_SCENES).filter((scene) => scene.type === 'ending')
  assert.equal(endings.length, 1)
  assert.equal(endings[0].id, 'act2-end')
})
