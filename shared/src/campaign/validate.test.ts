import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findCampaignErrors, findUnreachableScenes } from './validate.js'
import type { Campaign } from './types.js'

test('findCampaignErrors accepts a well-formed campaign', () => {
  const campaign: Campaign = {
    start: { type: 'narration', id: 'start', narration: '...', choices: [{ label: 'Go', next: 'end' }] },
    end: { type: 'ending', id: 'end', title: 'Done', narration: '...' },
  }
  assert.deepEqual(findCampaignErrors(campaign), [])
})

test('findCampaignErrors flags a narration choice pointing at a missing scene', () => {
  const campaign: Campaign = {
    start: { type: 'narration', id: 'start', narration: '...', choices: [{ label: 'Go', next: 'nowhere' }] },
  }
  const errors = findCampaignErrors(campaign)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /missing scene "nowhere"/)
})

test('findCampaignErrors flags an encounter successNext/failureNext pointing at missing scenes', () => {
  const campaign: Campaign = {
    fight: {
      type: 'encounter',
      id: 'fight',
      narration: '...',
      monster: { name: 'Wolf', description: '...', ac: 10, hp: 5 },
      choices: [{ label: 'Attack', actor: 'pc1', ability: 'STR', dc: 10, successNext: 'won', failureNext: 'lost' }],
    },
  }
  const errors = findCampaignErrors(campaign)
  assert.equal(errors.length, 2)
})

test('findCampaignErrors flags a narration scene with no choices', () => {
  const campaign: Campaign = {
    stuck: { type: 'narration', id: 'stuck', narration: '...', choices: [] },
  }
  assert.equal(findCampaignErrors(campaign).length, 1)
})

test('findCampaignErrors flags a scene keyed under the wrong id', () => {
  const campaign: Campaign = {
    a: { type: 'ending', id: 'b', title: 'Done', narration: '...' },
  }
  const errors = findCampaignErrors(campaign)
  assert.equal(errors.length, 1)
  assert.match(errors[0], /mismatched internal id/)
})

test('findUnreachableScenes finds a scene nothing points to', () => {
  const campaign: Campaign = {
    start: { type: 'narration', id: 'start', narration: '...', choices: [{ label: 'Go', next: 'end' }] },
    end: { type: 'ending', id: 'end', title: 'Done', narration: '...' },
    orphan: { type: 'ending', id: 'orphan', title: 'Orphan', narration: '...' },
  }
  assert.deepEqual(findUnreachableScenes(campaign, 'start'), ['orphan'])
})

test('findUnreachableScenes returns empty when every scene is reachable', () => {
  const campaign: Campaign = {
    start: { type: 'narration', id: 'start', narration: '...', choices: [{ label: 'Go', next: 'end' }] },
    end: { type: 'ending', id: 'end', title: 'Done', narration: '...' },
  }
  assert.deepEqual(findUnreachableScenes(campaign, 'start'), [])
})
