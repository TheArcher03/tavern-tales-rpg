import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACT1_SCENES } from './act1.js'
import { findCampaignErrors, findUnreachableScenes } from './validate.js'

test('Act 1 has no structural errors (dangling links, empty choice lists)', () => {
  assert.deepEqual(findCampaignErrors(ACT1_SCENES), [])
})

test('Act 1 has no scenes unreachable from the starting scene', () => {
  assert.deepEqual(findUnreachableScenes(ACT1_SCENES, 'act1-start'), [])
})

test('Act 1 has exactly one ending (the temporary Act 2 handoff stub)', () => {
  const endings = Object.values(ACT1_SCENES).filter((scene) => scene.type === 'ending')
  assert.equal(endings.length, 1)
  assert.equal(endings[0].id, 'act1-end')
})
