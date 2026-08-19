export type AbilityName = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'

export const ABILITY_NAMES: readonly AbilityName[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export type AbilityScores = Record<AbilityName, number>

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

// SRD 5.1: +2 at level 1, +1 every 4 levels thereafter.
export function proficiencyBonusForLevel(level: number): number {
  if (level < 1 || level > 20) {
    throw new Error(`level must be between 1 and 20, got ${level}`)
  }
  return 2 + Math.floor((level - 1) / 4)
}
