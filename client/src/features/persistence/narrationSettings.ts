// A device preference, not game state — deliberately separate from
// GameSave (it shouldn't travel with a save, and toggling it shouldn't
// touch story/party data at all).
const STORAGE_KEY = 'tavern-tales:narration-enabled'

export function loadNarrationEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === null ? true : raw === 'true'
  } catch {
    return true
  }
}

export function saveNarrationEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // Storage can fail (quota, private browsing) — losing this preference isn't fatal.
  }
}
