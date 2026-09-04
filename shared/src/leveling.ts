import { proficiencyBonusForLevel } from './abilities.js'
import { rollDie, type RollD20Options } from './dice.js'
import type { HitDie } from './characterClass.js'

export const MAX_LEVEL = 20

export interface ResolveLevelUpInput extends RollD20Options {
  currentLevel: number
  hitDie: HitDie
  conModifier: number
}

export interface LevelUpResult {
  newLevel: number
  /** Class hit die roll + CON modifier, floored at 1 per the SRD. */
  hitPointsGained: number
  newProficiencyBonus: number
}

export function resolveLevelUp({ currentLevel, hitDie, conModifier, random }: ResolveLevelUpInput): LevelUpResult {
  if (currentLevel >= MAX_LEVEL) {
    throw new Error(`character is already at the maximum level of ${MAX_LEVEL}`)
  }

  const newLevel = currentLevel + 1
  const roll = rollDie(hitDie, { random })
  const hitPointsGained = Math.max(1, roll + conModifier)

  return { newLevel, hitPointsGained, newProficiencyBonus: proficiencyBonusForLevel(newLevel) }
}
