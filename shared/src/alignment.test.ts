import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alignmentLabel, clampAlignmentValue, shiftAlignment } from './alignment.js'

test('alignmentLabel is True Neutral at the origin', () => {
  assert.equal(alignmentLabel({ moral: 0, ethical: 0 }), 'True Neutral')
})

test('alignmentLabel combines both axes when both are decisive', () => {
  assert.equal(alignmentLabel({ moral: 80, ethical: 80 }), 'Lawful Good')
  assert.equal(alignmentLabel({ moral: -80, ethical: -80 }), 'Chaotic Evil')
  assert.equal(alignmentLabel({ moral: 80, ethical: -80 }), 'Chaotic Good')
  assert.equal(alignmentLabel({ moral: -80, ethical: 80 }), 'Lawful Evil')
})

test('alignmentLabel names the decisive axis when the other is neutral', () => {
  assert.equal(alignmentLabel({ moral: 80, ethical: 0 }), 'Neutral Good')
  assert.equal(alignmentLabel({ moral: -80, ethical: 0 }), 'Neutral Evil')
  assert.equal(alignmentLabel({ moral: 0, ethical: 80 }), 'Lawful Neutral')
  assert.equal(alignmentLabel({ moral: 0, ethical: -80 }), 'Chaotic Neutral')
})

test('alignmentLabel treats values within the neutral band as Neutral', () => {
  assert.equal(alignmentLabel({ moral: 33, ethical: -33 }), 'True Neutral')
})

test('clampAlignmentValue keeps values within [-100, 100]', () => {
  assert.equal(clampAlignmentValue(150), 100)
  assert.equal(clampAlignmentValue(-150), -100)
  assert.equal(clampAlignmentValue(42), 42)
})

test('shiftAlignment applies and clamps both axes independently', () => {
  const result = shiftAlignment({ moral: 90, ethical: -90 }, 20, -20)
  assert.deepEqual(result, { moral: 100, ethical: -100 })
})

test('shiftAlignment defaults missing deltas to no change', () => {
  const result = shiftAlignment({ moral: 10, ethical: -10 }, 15)
  assert.deepEqual(result, { moral: 25, ethical: -10 })
})
