import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ACTIVE_CAMPAIGN, CAMPAIGN_START_SCENE_ID } from './activeCampaign.js'
import { findCampaignErrors, findUnreachableScenes } from './validate.js'

// The canonical structural gate for the shipped campaign, run against every
// act merged together (not each act in isolation — acts reference each
// other's story flags and hand off across act boundaries, so only the
// merged graph is meaningfully "closed"). Every future act just needs to be
// added to activeCampaign.ts; this test then automatically covers it.

test('the merged campaign has no structural errors (dangling links, empty choice lists)', () => {
  assert.deepEqual(findCampaignErrors(ACTIVE_CAMPAIGN), [])
})

test('the merged campaign has no scenes unreachable from the starting scene', () => {
  assert.deepEqual(findUnreachableScenes(ACTIVE_CAMPAIGN, CAMPAIGN_START_SCENE_ID), [])
})

test('the merged campaign has exactly one ending (the temporary Act 3 handoff stub)', () => {
  const endings = Object.values(ACTIVE_CAMPAIGN).filter((scene) => scene.type === 'ending')
  assert.equal(endings.length, 1)
  assert.equal(endings[0].id, 'act2-end')
})
