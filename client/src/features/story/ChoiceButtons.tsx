interface ChoiceButtonsProps {
  choices: string[]
  onChoose: (choice: string) => void
  disabled?: boolean
}

export function ChoiceButtons({ choices, onChoose, disabled = false }: ChoiceButtonsProps) {
  if (choices.length === 0) return null

  return (
    <div className="choice-buttons">
      {choices.map((choice) => (
        <button
          key={choice}
          type="button"
          className="choice-buttons__choice"
          onClick={() => onChoose(choice)}
          disabled={disabled}
        >
          {choice}
        </button>
      ))}
    </div>
  )
}
