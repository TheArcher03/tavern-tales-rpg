import type { AbilityName } from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export interface ChoiceActorInfo {
  name: string
  ability: AbilityName
  /** Ability modifier plus proficiency bonus if proficient — the actual number this check adds to the roll. */
  modifier: number
  proficient: boolean
}

export interface ChoiceDescriptor {
  label: string
  /** Who would act on this choice, and what their real modifier is — answers "which of my stats helps here" at a glance. */
  actor?: ChoiceActorInfo
}

interface ChoiceButtonsProps {
  choices: ChoiceDescriptor[]
  onChoose: (label: string) => void
  disabled?: boolean
}

export function ChoiceButtons({ choices, onChoose, disabled = false }: ChoiceButtonsProps) {
  if (choices.length === 0) return null

  return (
    <div className="choice-buttons">
      {choices.map((choice) => (
        <button
          key={choice.label}
          type="button"
          className="choice-buttons__choice"
          onClick={() => onChoose(choice.label)}
          disabled={disabled}
        >
          {choice.actor && (
            <span className="choice-buttons__actor" title={choice.actor.proficient ? 'Proficient — bonus included' : undefined}>
              {choice.actor.name} · {choice.actor.ability} {formatModifier(choice.actor.modifier)}
              {choice.actor.proficient && <span className="choice-buttons__proficient">★</span>}
            </span>
          )}
          {choice.label}
        </button>
      ))}
    </div>
  )
}
