import { useEffect, useRef, useState } from 'react'
import type { Character, StoryEntry } from '@tavern-tales/shared'
import { CharacterSheet } from './CharacterSheet'
import { StoryLog } from './StoryLog'
import { ChoiceButtons } from './ChoiceButtons'
import { FreeTextInput } from './FreeTextInput'
import { requestDmTurn } from './dmClient'
import './StoryShell.css'

const OPENING_ACTION = '(The adventure begins. Set the opening scene.)'

interface StoryShellProps {
  character: Character
  onApplyHitPointChange: (delta: number) => void
}

export function StoryShell({ character, onApplyHitPointChange }: StoryShellProps) {
  const [entries, setEntries] = useState<StoryEntry[]>([])
  const [suggestedChoices, setSuggestedChoices] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const characterRef = useRef(character)
  characterRef.current = character
  const hasStartedRef = useRef(false)

  const performDmTurn = async (playerAction: string, appendPlayerEntry: boolean) => {
    setIsLoading(true)
    setSuggestedChoices([])

    if (appendPlayerEntry) {
      setEntries((current) => [...current, { id: crypto.randomUUID(), speaker: 'player', text: playerAction }])
    }

    try {
      const result = await requestDmTurn({
        character: characterRef.current,
        storyLog: entries,
        playerAction,
      })
      setEntries((current) => [...current, { id: crypto.randomUUID(), speaker: 'dm', text: result.narration }])
      setSuggestedChoices(result.suggestedChoices)
      if (result.hitPointChange) {
        onApplyHitPointChange(result.hitPointChange.delta)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'The Dungeon Master could not be reached.'
      setEntries((current) => [...current, { id: crypto.randomUUID(), speaker: 'system', text: message }])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Guards against StrictMode's dev-only double-invoke of mount effects —
    // each call here is a real, billable DM turn.
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    void performDmTurn(OPENING_ACTION, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="story-shell">
      <CharacterSheet character={character} />
      <main className="story-shell__main">
        <StoryLog entries={entries} />
        {isLoading && <p className="story-shell__loading">The Dungeon Master is thinking…</p>}
        <ChoiceButtons
          choices={suggestedChoices}
          onChoose={(choice) => void performDmTurn(choice, true)}
          disabled={isLoading}
        />
        <FreeTextInput onSubmit={(text) => void performDmTurn(text, true)} disabled={isLoading} />
      </main>
    </div>
  )
}
