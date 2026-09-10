import { useEffect, useState } from 'react'
import { ACTIVE_CAMPAIGN, CAMPAIGN_START_SCENE_ID, type PartyState, type StoryEntry } from '@tavern-tales/shared'
import { PartyCreation } from './features/party/PartyCreation'
import { StoryShell } from './features/story/StoryShell'
import { clearGame, loadGame, saveGame, type GameSave } from './features/persistence/gameSave'

// A save's currentSceneId can point at a scene that no longer exists in
// ACTIVE_CAMPAIGN — most commonly right after swapping in a new/later act.
// Treat that the same as "no save" rather than crashing on an unknown scene.
function resolveInitialSave(): GameSave | null {
  const save = loadGame()
  if (save && !ACTIVE_CAMPAIGN[save.party.currentSceneId]) {
    clearGame()
    return null
  }
  return save
}

const savedGame = resolveInitialSave()

function App() {
  const [party, setParty] = useState<PartyState | null>(savedGame?.party ?? null)
  const [entries, setEntries] = useState<StoryEntry[]>(savedGame?.storyEntries ?? [])

  useEffect(() => {
    if (party) {
      saveGame({ party, storyEntries: entries })
    }
  }, [party, entries])

  const startNewGame = () => {
    if (!window.confirm('Start a new adventure? This will erase your current party and story.')) return
    clearGame()
    setParty(null)
    setEntries([])
  }

  const updateParty = (updater: PartyState | ((current: PartyState) => PartyState)) => {
    setParty((current) => {
      if (!current) return current
      return typeof updater === 'function' ? updater(current) : updater
    })
  }

  if (!party) {
    return <PartyCreation startingSceneId={CAMPAIGN_START_SCENE_ID} onReady={setParty} />
  }

  return (
    <StoryShell
      party={party}
      onPartyChange={updateParty}
      entries={entries}
      onEntriesChange={setEntries}
      onStartNewGame={startNewGame}
    />
  )
}

export default App
