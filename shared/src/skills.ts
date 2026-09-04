import type { AbilityName } from './abilities.js'

// SRD 5.1 skill list and the ability score each is tied to.
export const SKILL_ABILITIES = {
  Athletics: 'STR',
  Acrobatics: 'DEX',
  'Sleight of Hand': 'DEX',
  Stealth: 'DEX',
  Arcana: 'INT',
  History: 'INT',
  Investigation: 'INT',
  Nature: 'INT',
  Religion: 'INT',
  'Animal Handling': 'WIS',
  Insight: 'WIS',
  Medicine: 'WIS',
  Perception: 'WIS',
  Survival: 'WIS',
  Deception: 'CHA',
  Intimidation: 'CHA',
  Performance: 'CHA',
  Persuasion: 'CHA',
} as const satisfies Record<string, AbilityName>

export type SkillName = keyof typeof SKILL_ABILITIES

export function isSkillName(value: string): value is SkillName {
  return value in SKILL_ABILITIES
}
