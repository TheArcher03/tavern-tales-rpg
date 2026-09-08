import type { Character, StoryEntry } from '@tavern-tales/shared'

const STORAGE_KEY = 'tavern-tales:save'

export interface GameSave {
  character: Character
  storyEntries: StoryEntry[]
  suggestedChoices: string[]
}

function isGameSave(value: unknown): value is GameSave {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<GameSave>
  return (
    typeof candidate.character === 'object' &&
    candidate.character !== null &&
    Array.isArray(candidate.storyEntries) &&
    Array.isArray(candidate.suggestedChoices)
  )
}

// A single save slot is enough to let a campaign survive a refresh — the
// simplest thing that makes "campaign" true. Named/multiple saves would be
// a natural follow-up but aren't required for that.
export function loadGame(): GameSave | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isGameSave(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveGame(save: GameSave): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save))
  } catch {
    // Storage can fail (quota, private browsing) — losing the autosave isn't fatal.
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
