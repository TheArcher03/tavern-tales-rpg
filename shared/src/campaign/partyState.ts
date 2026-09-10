import type { Character } from '../character.js'
import type { Item } from '../item.js'

// Fixed order matching PartySlot: [pc1, pc2, companion1, companion2].
export interface PartyState {
  members: [Character, Character, Character, Character]
  sharedGold: number
  sharedTreasure: Item[]
  storyFlags: Record<string, boolean>
  currentSceneId: string
}

export function createPartyState(
  members: [Character, Character, Character, Character],
  startingSceneId: string,
): PartyState {
  return {
    members,
    sharedGold: 0,
    sharedTreasure: [],
    storyFlags: {},
    currentSceneId: startingSceneId,
  }
}
