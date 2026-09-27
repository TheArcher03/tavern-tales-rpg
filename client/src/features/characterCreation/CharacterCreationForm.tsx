import { useState, type FormEvent } from 'react'
import {
  ABILITY_NAMES,
  BACKGROUNDS,
  CHARACTER_CLASSES,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_MIN_SCORE,
  RACES,
  createCharacter,
  pointBuyCost,
  validatePointBuy,
  type AbilityName,
  type AbilityScores,
  type Character,
} from '@tavern-tales/shared'
import { AbilityScoreAllocator } from './AbilityScoreAllocator'
import { ClassIcon } from '../story/ClassIcon'
import './CharacterCreationForm.css'

const RANDOM_NAME_POOL = [
  'Aria',
  'Bram',
  'Cassia',
  'Doran',
  'Elspeth',
  'Fenn',
  'Guin',
  'Halric',
  'Ivo',
  'Jessa',
  'Kellan',
  'Liora',
  'Merrick',
  'Nessa',
  'Orin',
  'Perrin',
  'Quenna',
  'Roswyn',
  'Sabine',
  'Torvald',
]

function defaultAbilityScores(): AbilityScores {
  return Object.fromEntries(ABILITY_NAMES.map((name) => [name, POINT_BUY_MIN_SCORE])) as AbilityScores
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

// Spends the full point-buy budget across randomly-ordered abilities —
// unlike the companion generator's class-weighted allocation, this is
// meant to feel like a genuine reroll, not a tuned build.
function randomAbilityScores(): AbilityScores {
  const scores = defaultAbilityScores()
  let remaining = POINT_BUY_BUDGET
  let incrementable = [...ABILITY_NAMES]

  while (incrementable.length > 0) {
    const name = pickRandom(incrementable)
    const cost = pointBuyCost(scores[name] + 1) - pointBuyCost(scores[name])
    if (cost > remaining) {
      incrementable = incrementable.filter((candidate) => candidate !== name)
      continue
    }
    scores[name] += 1
    remaining -= cost
    if (scores[name] >= POINT_BUY_MAX_SCORE) {
      incrementable = incrementable.filter((candidate) => candidate !== name)
    }
  }

  return scores
}

interface CharacterCreationFormProps {
  onCreate: (character: Character) => void
}

export function CharacterCreationForm({ onCreate }: CharacterCreationFormProps) {
  const [name, setName] = useState('')
  const [raceId, setRaceId] = useState(RACES[0].id)
  const [classId, setClassId] = useState(CHARACTER_CLASSES[0].id)
  const [backgroundId, setBackgroundId] = useState(BACKGROUNDS[0].id)
  const [abilityScores, setAbilityScores] = useState<AbilityScores>(defaultAbilityScores)
  const [error, setError] = useState<string | null>(null)

  const adjustAbility = (name: AbilityName, delta: 1 | -1) => {
    setAbilityScores((scores) => ({ ...scores, [name]: scores[name] + delta }))
  }

  const randomize = () => {
    setName(pickRandom(RANDOM_NAME_POOL))
    setRaceId(pickRandom(RACES).id)
    setClassId(pickRandom(CHARACTER_CLASSES).id)
    setBackgroundId(pickRandom(BACKGROUNDS).id)
    setAbilityScores(randomAbilityScores())
    setError(null)
  }

  const canSubmit = name.trim().length > 0 && validatePointBuy(abilityScores).valid

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    try {
      const character = createCharacter({
        id: crypto.randomUUID(),
        name: name.trim(),
        raceId,
        classId,
        backgroundId,
        baseAbilityScores: abilityScores,
      })
      onCreate(character)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create character.')
    }
  }

  return (
    <form className="character-creation" onSubmit={handleSubmit}>
      <div className="character-creation__header">
        <h1>Create your character</h1>
        <button
          type="button"
          className="character-creation__randomize"
          onClick={randomize}
          title="Randomize this character"
          aria-label="Randomize this character"
        >
          🎲
        </button>
      </div>

      <label className="character-creation__field">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Aria" />
      </label>

      <label className="character-creation__field">
        Race
        <select value={raceId} onChange={(event) => setRaceId(event.target.value)}>
          {RACES.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name}
            </option>
          ))}
        </select>
      </label>

      <label className="character-creation__field">
        Class
        <div className="character-creation__class-row">
          <ClassIcon classId={classId} className="character-creation__class-icon" />
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            {CHARACTER_CLASSES.map((characterClass) => (
              <option key={characterClass.id} value={characterClass.id}>
                {characterClass.name}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label className="character-creation__field">
        Background
        <select value={backgroundId} onChange={(event) => setBackgroundId(event.target.value)}>
          {BACKGROUNDS.map((background) => (
            <option key={background.id} value={background.id}>
              {background.name}
            </option>
          ))}
        </select>
      </label>

      <AbilityScoreAllocator
        scores={abilityScores}
        onIncrement={(abilityName) => adjustAbility(abilityName, 1)}
        onDecrement={(abilityName) => adjustAbility(abilityName, -1)}
      />

      {error && <p className="character-creation__error">{error}</p>}

      <button type="submit" disabled={!canSubmit}>
        Begin adventure
      </button>
    </form>
  )
}
