export type StorySpeaker = 'dm' | 'player' | 'system'

export interface StoryEntry {
  id: string
  speaker: StorySpeaker
  text: string
}
