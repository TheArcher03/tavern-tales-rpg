import { useState } from 'react'
import type { Character } from '@tavern-tales/shared'
import { CharacterCreationForm } from './features/characterCreation/CharacterCreationForm'
import { StoryShell } from './features/story/StoryShell'

function App() {
  const [character, setCharacter] = useState<Character | null>(null)

  const applyHitPointChange = (delta: number) => {
    setCharacter((current) => {
      if (!current) return current
      const nextCurrent = Math.max(0, Math.min(current.hitPoints.max, current.hitPoints.current + delta))
      return { ...current, hitPoints: { ...current.hitPoints, current: nextCurrent } }
    })
  }

  if (!character) {
    return <CharacterCreationForm onCreate={setCharacter} />
  }

  return <StoryShell character={character} onApplyHitPointChange={applyHitPointChange} />
}

export default App
