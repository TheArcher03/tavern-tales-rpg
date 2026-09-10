import { ABILITY_NAMES, type AbilityName, type Character } from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

interface LevelUpChoiceProps {
  character: Character
  onPick: (ability: AbilityName) => void
}

// Shown once per pending player slot after a levelUp effect fires — the HP
// and proficiency bonus are already applied by the time this renders;
// picking here just adds the +1 ability increase on top. Companions never
// see this screen — their ability increase is auto-assigned immediately.
export function LevelUpChoice({ character, onPick }: LevelUpChoiceProps) {
  return (
    <div className="level-up-choice">
      <h2 className="level-up-choice__title">
        {character.name} reaches level {character.level}
      </h2>
      <p className="level-up-choice__subtitle">Choose one ability to increase by 1.</p>
      <div className="level-up-choice__grid">
        {ABILITY_NAMES.map((ability) => (
          <button
            key={ability}
            type="button"
            className="level-up-choice__ability"
            onClick={() => onPick(ability)}
          >
            <span className="level-up-choice__ability-name">{ability}</span>
            <span className="level-up-choice__ability-score">
              {character.abilityScores[ability]} ({formatModifier(character.abilityModifiers[ability])})
            </span>
            <span className="level-up-choice__ability-plus">+1</span>
          </button>
        ))}
      </div>
    </div>
  )
}
