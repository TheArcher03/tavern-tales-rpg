export interface Background {
  id: string
  name: string
  skillProficiencies: string[]
}

// Starter set from the SRD 5.1 core backgrounds. More can be added as
// content work continues — this is not meant to be exhaustive yet.
export const BACKGROUNDS: readonly Background[] = [
  { id: 'acolyte', name: 'Acolyte', skillProficiencies: ['Insight', 'Religion'] },
  { id: 'soldier', name: 'Soldier', skillProficiencies: ['Athletics', 'Intimidation'] },
  { id: 'criminal', name: 'Criminal', skillProficiencies: ['Deception', 'Stealth'] },
  { id: 'sage', name: 'Sage', skillProficiencies: ['Arcana', 'History'] },
]

export function getBackground(id: string): Background {
  const background = BACKGROUNDS.find((b) => b.id === id)
  if (!background) {
    throw new Error(`unknown background id "${id}"`)
  }
  return background
}
