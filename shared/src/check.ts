import { abilityModifier } from './abilities.js'
import { rollD20, type RollD20Options } from './dice.js'

export interface ResolveCheckInput extends RollD20Options {
  abilityScore: number
  dc: number
  proficient: boolean
  proficiencyBonus: number
}

export interface CheckResult {
  roll: number
  modifier: number
  total: number
  dc: number
  success: boolean
}

// Resolves a d20 ability check/attack roll in code — SRD 5.1: d20 + ability
// modifier (+ proficiency bonus, if proficient) vs. a DC (or target AC).
export function resolveCheck({
  abilityScore,
  dc,
  proficient,
  proficiencyBonus,
  random,
}: ResolveCheckInput): CheckResult {
  const roll = rollD20({ random })
  const modifier = abilityModifier(abilityScore) + (proficient ? proficiencyBonus : 0)
  const total = roll + modifier
  return { roll, modifier, total, dc, success: total >= dc }
}
