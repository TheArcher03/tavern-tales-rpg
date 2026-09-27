export type StorySpeaker = 'dm' | 'player' | 'system' | 'image'

// For speaker 'image', `text` holds the scene id the image belongs to
// (not narration prose) — the client looks up the actual asset for that
// scene id, keeping this package free of any asset-loading concerns.
export interface StoryEntry {
  id: string
  speaker: StorySpeaker
  text: string
}
