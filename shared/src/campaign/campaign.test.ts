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

test('the merged campaign has exactly four distinct endings', () => {
  const endings = Object.values(ACTIVE_CAMPAIGN).filter((scene) => scene.type === 'ending')
  const ids = endings.map((ending) => ending.id).sort()
  assert.deepEqual(ids, ['act3-ending-bound', 'act3-ending-circle', 'act3-ending-spared', 'act3-ending-wakes'])
})

test('every ending has a distinct title', () => {
  const endings = Object.values(ACTIVE_CAMPAIGN).filter((scene) => scene.type === 'ending')
  const titles = new Set(endings.map((ending) => (ending.type === 'ending' ? ending.title : '')))
  assert.equal(titles.size, endings.length)
})
