import { useState } from 'react'
import type { Character } from '@tavern-tales/shared'
import { CharacterSheet } from './CharacterSheet'
import { StoryLog, type StoryEntry } from './StoryLog'
import { ChoiceButtons } from './ChoiceButtons'
import { FreeTextInput } from './FreeTextInput'
import './StoryShell.css'

const INTRO_TEXT =
  'You stand at the edge of a lantern-lit tavern, rain hissing against the shutters. ' +
  'The Dungeon Master is not connected yet — for now, whatever you choose is simply recorded below.'

const PLACEHOLDER_CHOICES = ['Step inside', 'Look around first', 'Knock on the door']

export function StoryShell({ character }: { character: Character }) {
  const [entries, setEntries] = useState<StoryEntry[]>([{ id: 'intro', speaker: 'dm', text: INTRO_TEXT }])

  const recordPlayerAction = (text: string) => {
    setEntries((current) => [...current, { id: crypto.randomUUID(), speaker: 'player', text }])
  }

  return (
    <div className="story-shell">
      <CharacterSheet character={character} />
      <main className="story-shell__main">
        <StoryLog entries={entries} />
        <ChoiceButtons choices={PLACEHOLDER_CHOICES} onChoose={recordPlayerAction} />
        <FreeTextInput onSubmit={recordPlayerAction} />
      </main>
    </div>
  )
}
