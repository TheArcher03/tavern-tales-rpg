import { useEffect, useState } from 'react'
import {
  shiftAlignment,
  type Character,
  type DmAlignmentShift,
  type DmLevelUpResult,
  type StoryEntry,
} from '@tavern-tales/shared'
import { CharacterCreationForm } from './features/characterCreation/CharacterCreationForm'
import { StoryShell } from './features/story/StoryShell'
import { clearGame, loadGame, saveGame } from './features/persistence/gameSave'

const savedGame = loadGame()

function App() {
  const [character, setCharacter] = useState<Character | null>(savedGame?.character ?? null)
  const [entries, setEntries] = useState<StoryEntry[]>(savedGame?.storyEntries ?? [])
  const [suggestedChoices, setSuggestedChoices] = useState<string[]>(savedGame?.suggestedChoices ?? [])

  useEffect(() => {
    if (character) {
      saveGame({ character, storyEntries: entries, suggestedChoices })
    }
  }, [character, entries, suggestedChoices])

  const applyHitPointChange = (delta: number) => {
    setCharacter((current) => {
      if (!current) return current
      const nextCurrent = Math.max(0, Math.min(current.hitPoints.max, current.hitPoints.current + delta))
      return { ...current, hitPoints: { ...current.hitPoints, current: nextCurrent } }
    })
  }

  const applyLevelUp = (result: DmLevelUpResult) => {
    setCharacter((current) => {
      if (!current) return current
      const nextMax = current.hitPoints.max + result.hitPointsGained
      const skillProficiencies =
        result.newSkillProficiency && !current.skillProficiencies.includes(result.newSkillProficiency)
          ? [...current.skillProficiencies, result.newSkillProficiency]
          : current.skillProficiencies
      return {
        ...current,
        level: result.newLevel,
        proficiencyBonus: result.newProficiencyBonus,
        hitPoints: { max: nextMax, current: current.hitPoints.current + result.hitPointsGained },
        skillProficiencies,
      }
    })
  }

  const applyAlignmentShift = (shift: DmAlignmentShift) => {
    setCharacter((current) => {
      if (!current) return current
      return { ...current, alignment: shiftAlignment(current.alignment, shift.moralDelta, shift.ethicalDelta) }
    })
  }

  const startNewGame = () => {
    if (!window.confirm('Start a new adventure? This will erase your current character and story.')) return
    clearGame()
    setCharacter(null)
    setEntries([])
    setSuggestedChoices([])
  }

  if (!character) {
    return <CharacterCreationForm onCreate={setCharacter} />
  }

  return (
    <StoryShell
      character={character}
      entries={entries}
      onEntriesChange={setEntries}
      suggestedChoices={suggestedChoices}
      onSuggestedChoicesChange={setSuggestedChoices}
      onApplyHitPointChange={applyHitPointChange}
      onApplyLevelUp={applyLevelUp}
      onApplyAlignmentShift={applyAlignmentShift}
      onStartNewGame={startNewGame}
    />
  )
}

export default App
