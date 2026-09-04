import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SKILL_ABILITIES, isSkillName } from './skills.js'

test('isSkillName recognizes canonical SRD skills', () => {
  assert.equal(isSkillName('Athletics'), true)
  assert.equal(isSkillName('Stealth'), true)
  assert.equal(isSkillName('Juggling'), false)
})

test('SKILL_ABILITIES maps every skill to a valid ability', () => {
  assert.equal(SKILL_ABILITIES.Athletics, 'STR')
  assert.equal(SKILL_ABILITIES.Stealth, 'DEX')
  assert.equal(SKILL_ABILITIES.Arcana, 'INT')
  assert.equal(SKILL_ABILITIES.Insight, 'WIS')
  assert.equal(SKILL_ABILITIES.Persuasion, 'CHA')
})
