import type { AbilityScores } from './abilities.js'

export interface Race {
  id: string
  name: string
  speed: number
  abilityScoreIncreases: Partial<AbilityScores>
}

// Starter set from the SRD 5.1 core races. More can be added as content
// work continues — this is not meant to be exhaustive yet.
export const RACES: readonly Race[] = [
  { id: 'human', name: 'Human', speed: 30, abilityScoreIncreases: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
  { id: 'elf', name: 'Elf', speed: 30, abilityScoreIncreases: { DEX: 2 } },
  { id: 'dwarf', name: 'Dwarf', speed: 25, abilityScoreIncreases: { CON: 2 } },
  { id: 'halfling', name: 'Halfling', speed: 25, abilityScoreIncreases: { DEX: 2 } },
]

export function getRace(id: string): Race {
  const race = RACES.find((r) => r.id === id)
  if (!race) {
    throw new Error(`unknown race id "${id}"`)
  }
  return race
}
