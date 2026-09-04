import { useState } from 'react'
import { shiftAlignment, type Character, type DmAlignmentShift, type DmLevelUpResult } from '@tavern-tales/shared'
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

  if (!character) {
    return <CharacterCreationForm onCreate={setCharacter} />
  }

  return (
    <StoryShell
      character={character}
      onApplyHitPointChange={applyHitPointChange}
      onApplyLevelUp={applyLevelUp}
      onApplyAlignmentShift={applyAlignmentShift}
    />
  )
}

export default App
