import { useState } from 'react'
import type { Character } from '@tavern-tales/shared'
import { CharacterCreationForm } from './features/characterCreation/CharacterCreationForm'
import { StoryShell } from './features/story/StoryShell'

function App() {
  const [character, setCharacter] = useState<Character | null>(null)

  if (!character) {
    return <CharacterCreationForm onCreate={setCharacter} />
  }

  return <StoryShell character={character} />
}

export default App
