import { useState } from 'react'
import { createPartyState, generateCompanion, getCharacterClass, type Character, type PartyState } from '@tavern-tales/shared'
import { CharacterCreationForm } from '../characterCreation/CharacterCreationForm'
import './PartyCreation.css'

const COMPANION_NAMES = ['Brenna', 'Osric', 'Talia', 'Corwin', 'Elowen', 'Garrick', 'Ysolde', 'Thane', 'Maren', 'Dorin']

function generateCompanionName(exclude: string[]): string {
  const pool = COMPANION_NAMES.filter((name) => !exclude.includes(name))
  const candidates = pool.length > 0 ? pool : COMPANION_NAMES
  return candidates[Math.floor(Math.random() * candidates.length)]
}

type Step =
  | { kind: 'pc1' }
  | { kind: 'pc2'; pc1: Character }
  | { kind: 'reveal'; pc1: Character; pc2: Character; companion1: Character; companion2: Character }

interface PartyCreationProps {
  startingSceneId: string
  onReady: (party: PartyState) => void
}

export function PartyCreation({ startingSceneId, onReady }: PartyCreationProps) {
  const [step, setStep] = useState<Step>({ kind: 'pc1' })

  if (step.kind === 'pc1') {
    return (
      <div className="party-creation">
        <p className="party-creation__step">Character 1 of 2</p>
        <CharacterCreationForm key="pc1" onCreate={(pc1) => setStep({ kind: 'pc2', pc1 })} />
      </div>
    )
  }

  if (step.kind === 'pc2') {
    return (
      <div className="party-creation">
        <p className="party-creation__step">Character 2 of 2</p>
        <CharacterCreationForm
          key="pc2"
          onCreate={(pc2) => {
            const takenNames = [step.pc1.name, pc2.name]
            const companion1 = generateCompanion({
              id: crypto.randomUUID(),
              name: generateCompanionName(takenNames),
              existingClassIds: [step.pc1.classId, pc2.classId],
            })
            const companion2 = generateCompanion({
              id: crypto.randomUUID(),
              name: generateCompanionName([...takenNames, companion1.name]),
              existingClassIds: [step.pc1.classId, pc2.classId, companion1.classId],
            })
            setStep({ kind: 'reveal', pc1: step.pc1, pc2, companion1, companion2 })
          }}
        />
      </div>
    )
  }

  const { pc1, pc2, companion1, companion2 } = step

  return (
    <div className="party-creation party-creation__reveal">
      <h1>Your party is complete</h1>
      <ul className="party-creation__roster">
        <li>
          <strong>{pc1.name}</strong> — your character
        </li>
        <li>
          <strong>{pc2.name}</strong> — your character
        </li>
        <li>
          <strong>{companion1.name}</strong> joins you, a level {companion1.level} {getCharacterClass(companion1.classId).name}
        </li>
        <li>
          <strong>{companion2.name}</strong> joins you, a level {companion2.level} {getCharacterClass(companion2.classId).name}
        </li>
      </ul>
      <button
        type="button"
        onClick={() => onReady(createPartyState([pc1, pc2, companion1, companion2], startingSceneId))}
      >
        Begin the adventure
      </button>
    </div>
  )
}
