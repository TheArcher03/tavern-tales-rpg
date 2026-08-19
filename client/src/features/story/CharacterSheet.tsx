import { ABILITY_NAMES, getBackground, getCharacterClass, getRace, type Character } from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function CharacterSheet({ character }: { character: Character }) {
  const race = getRace(character.raceId)
  const characterClass = getCharacterClass(character.classId)
  const background = getBackground(character.backgroundId)

  return (
    <aside className="character-sheet">
      <h2>{character.name}</h2>
      <p className="character-sheet__subtitle">
        Level {character.level} {race.name} {characterClass.name} &middot; {background.name}
      </p>

      <dl className="character-sheet__stats">
        <div>
          <dt>HP</dt>
          <dd>
            {character.hitPoints.current} / {character.hitPoints.max}
          </dd>
        </div>
        <div>
          <dt>AC</dt>
          <dd>{character.armorClass}</dd>
        </div>
        <div>
          <dt>Proficiency</dt>
          <dd>{formatModifier(character.proficiencyBonus)}</dd>
        </div>
      </dl>

      <ul className="character-sheet__abilities">
        {ABILITY_NAMES.map((name) => (
          <li key={name}>
            <span className="character-sheet__ability-name">{name}</span>
            <span className="character-sheet__ability-score">{character.abilityScores[name]}</span>
            <span className="character-sheet__ability-modifier">{formatModifier(character.abilityModifiers[name])}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
