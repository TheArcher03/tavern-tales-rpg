import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACT3_SCENES } from './act3.js'

// Same reasoning as act1.test.ts/act2.test.ts: Act 3 references Act 1-2
// story flags (wardsWeakened, metMeva) and is the final act, so it's only
// a fully closed graph once merged with Acts 1-2 — full cross-act
// reachability and ending-count validation happens in campaign.test.ts.

test('Act 3 starts at act3-start, a narration scene', () => {
  const start = ACT3_SCENES['act3-start']
  assert.ok(start, 'act3-start should exist')
  assert.equal(start.type, 'narration')
})

test('the ritual confrontation offers an easier approach gated on wardsWeakened', () => {
  const scene = ACT3_SCENES['act3-ritual-confront']
  assert.ok(scene, 'act3-ritual-confront should exist')
  assert.equal(scene.type, 'encounter')
  if (scene.type !== 'encounter') return
  const gated = scene.choices.find((choice) => choice.condition?.flag === 'wardsWeakened')
  assert.ok(gated, 'a wardsWeakened-gated choice should exist')
  const ungated = scene.choices.find((choice) => !choice.condition)
  assert.ok(ungated, 'an always-available choice should also exist')
  assert.ok(gated!.dc < ungated!.dc, 'the prepared approach should be easier than the direct one')
})

test('the Meva hub spoke is only offered after meeting her on the open-trail route', () => {
  const hub = ACT3_SCENES['act3-hub']
  assert.equal(hub.type, 'narration')
  if (hub.type !== 'narration') return
  const mevaChoice = hub.choices.find((choice) => choice.next === 'act3-meva')
  assert.ok(mevaChoice, 'a choice leading to act3-meva should exist')
  assert.deepEqual(mevaChoice?.condition, { flag: 'metMeva' })
})

test('Act 3 defines exactly four distinct endings', () => {
  const endings = Object.values(ACT3_SCENES).filter((scene) => scene.type === 'ending')
  const ids = endings.map((ending) => ending.id).sort()
  assert.deepEqual(ids, ['act3-ending-bound', 'act3-ending-circle', 'act3-ending-spared', 'act3-ending-wakes'])
})

test("Vesh's fate choice offers three branches: strike, spare, or hear her out", () => {
  const scene = ACT3_SCENES['act3-vesh-choice']
  assert.equal(scene.type, 'narration')
  if (scene.type !== 'narration') return
  const nextIds = scene.choices.map((choice) => choice.next).sort()
  assert.deepEqual(nextIds, ['act3-ending-bound', 'act3-ending-spared', 'act3-vesh-bargain'])
})
