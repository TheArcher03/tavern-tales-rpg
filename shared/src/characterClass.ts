import type { AbilityName } from './abilities.js'

export type HitDie = 6 | 8 | 10 | 12

export interface CharacterClass {
  id: string
  name: string
  hitDie: HitDie
  savingThrowProficiencies: AbilityName[]
}

// Starter set from the SRD 5.1 core classes. More can be added as content
// work continues — this is not meant to be exhaustive yet.
export const CHARACTER_CLASSES: readonly CharacterClass[] = [
  { id: 'fighter', name: 'Fighter', hitDie: 10, savingThrowProficiencies: ['STR', 'CON'] },
  { id: 'wizard', name: 'Wizard', hitDie: 6, savingThrowProficiencies: ['INT', 'WIS'] },
  { id: 'rogue', name: 'Rogue', hitDie: 8, savingThrowProficiencies: ['DEX', 'INT'] },
  { id: 'cleric', name: 'Cleric', hitDie: 8, savingThrowProficiencies: ['WIS', 'CHA'] },
]

export function getCharacterClass(id: string): CharacterClass {
  const characterClass = CHARACTER_CLASSES.find((c) => c.id === id)
  if (!characterClass) {
    throw new Error(`unknown class id "${id}"`)
  }
  return characterClass
}
