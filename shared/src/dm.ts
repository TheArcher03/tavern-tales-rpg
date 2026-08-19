import type { Character } from './character.js'
import type { StoryEntry } from './story.js'

export interface DmTurnRequest {
  character: Character
  storyLog: StoryEntry[]
  playerAction: string
}

export interface DmHitPointChange {
  delta: number
  reason: string
}

export interface DmTurnResult {
  narration: string
  suggestedChoices: string[]
  hitPointChange?: DmHitPointChange
}
