export interface ChoiceDescriptor {
  label: string
  /** Which party member would act on this choice — shown as a small tag so the player knows who they're committing before picking. */
  actorName?: string
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
          {choice.actorName && <span className="choice-buttons__actor">{choice.actorName}</span>}
          {choice.label}
        </button>
      ))}
    </div>
  )
}
