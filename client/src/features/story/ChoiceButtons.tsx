interface ChoiceButtonsProps {
  choices: string[]
  onChoose: (choice: string) => void
}

export function ChoiceButtons({ choices, onChoose }: ChoiceButtonsProps) {
  return (
    <div className="choice-buttons">
      {choices.map((choice) => (
        <button key={choice} type="button" className="choice-buttons__choice" onClick={() => onChoose(choice)}>
          {choice}
        </button>
      ))}
    </div>
  )
}
