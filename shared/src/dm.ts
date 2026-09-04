import type { AbilityName } from './abilities.js'
import type { CheckResult } from './check.js'
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

export type DmCheckType = 'ability_check' | 'attack'

export interface DmCheckResult extends CheckResult {
  checkType: DmCheckType
  ability: AbilityName
  skill?: string
  reason: string
}

export interface DmTurnResult {
  narration: string
  suggestedChoices: string[]
  hitPointChange?: DmHitPointChange
  checkResult?: DmCheckResult
}
