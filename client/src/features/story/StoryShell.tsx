import { useEffect, useRef } from 'react'
import {
  ACTIVE_CAMPAIGN,
  isChoiceAvailable,
  resolveChoice,
  resolveEncounterChoice,
  type Choice,
  type ChoiceOutcome,
  type EncounterChoice,
  type PartyState,
  type StoryEntry,
} from '@tavern-tales/shared'
import { PartyPanel } from './PartyPanel'
import { StoryLog } from './StoryLog'
import { ChoiceButtons } from './ChoiceButtons'
import './StoryShell.css'

interface StoryShellProps {
  party: PartyState
  onPartyChange: (updater: PartyState | ((current: PartyState) => PartyState)) => void
  entries: StoryEntry[]
  onEntriesChange: (updater: StoryEntry[] | ((current: StoryEntry[]) => StoryEntry[])) => void
  onStartNewGame: () => void
}

export function StoryShell({ party, onPartyChange, entries, onEntriesChange, onStartNewGame }: StoryShellProps) {
  const hasStartedRef = useRef(false)
  const scene = ACTIVE_CAMPAIGN[party.currentSceneId]

  useEffect(() => {
    // Guards against StrictMode's dev-only double-invoke of mount effects,
    // and skips re-seeding the log when resuming a saved game.
    if (hasStartedRef.current || entries.length > 0) return
    hasStartedRef.current = true
    onEntriesChange([{ id: crypto.randomUUID(), speaker: 'dm', text: scene.narration }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyOutcome = (choiceLabel: string, outcome: ChoiceOutcome, checkLog?: string) => {
    const nextScene = ACTIVE_CAMPAIGN[outcome.nextSceneId]
    onEntriesChange((current) => {
      const next: StoryEntry[] = [...current, { id: crypto.randomUUID(), speaker: 'player', text: choiceLabel }]
      if (checkLog) next.push({ id: crypto.randomUUID(), speaker: 'system', text: checkLog })
      for (const log of outcome.logs) next.push({ id: crypto.randomUUID(), speaker: 'system', text: log })
      if (nextScene.type === 'ending') {
        next.push({ id: crypto.randomUUID(), speaker: 'system', text: `🏁 ${nextScene.title}` })
      }
      next.push({ id: crypto.randomUUID(), speaker: 'dm', text: nextScene.narration })
      return next
    })
    onPartyChange({ ...outcome.party, currentSceneId: outcome.nextSceneId })
  }

  const handleChoice = (choice: Choice) => applyOutcome(choice.label, resolveChoice(party, choice))

  const handleEncounterChoice = (choice: EncounterChoice) => {
    const outcome = resolveEncounterChoice(party, choice)
    applyOutcome(choice.label, outcome, outcome.checkLog)
  }

  const availableChoices = scene.type === 'ending' ? [] : scene.choices.filter((choice) => isChoiceAvailable(party, choice.condition))

  return (
    <div className="story-shell">
      <PartyPanel party={party} />
      <main className="story-shell__main">
        <StoryLog entries={entries} />
        {scene.type === 'ending' ? (
          <p className="story-shell__ending-note">The story ends here.</p>
        ) : (
          <ChoiceButtons
            choices={availableChoices.map((choice) => choice.label)}
            onChoose={(label) => {
              const choice = availableChoices.find((candidate) => candidate.label === label)
              if (!choice) return
              if (scene.type === 'encounter') handleEncounterChoice(choice as EncounterChoice)
              else handleChoice(choice as Choice)
            }}
          />
        )}
        <button type="button" className="story-shell__new-game" onClick={onStartNewGame}>
          Start a new adventure
        </button>
      </main>
    </div>
  )
}
