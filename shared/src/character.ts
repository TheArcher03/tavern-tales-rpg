import { ABILITY_NAMES, abilityModifier, proficiencyBonusForLevel, type AbilityName, type AbilityScores } from './abilities.js'
import type { Alignment } from './alignment.js'
import type { Curse } from './curse.js'
import { validatePointBuy } from './pointBuy.js'
import { getRace } from './race.js'
import { getCharacterClass } from './characterClass.js'
import { getBackground } from './background.js'
import type { SkillName } from './skills.js'

export type CharacterRole = 'player' | 'companion'

export interface Character {
  id: string
  name: string
  raceId: string
  classId: string
  backgroundId: string
  level: number
  /** Point-buy allocation before racial increases. */
  baseAbilityScores: AbilityScores
  /** Base scores plus racial increases. */
  abilityScores: AbilityScores
  abilityModifiers: AbilityScores
  proficiencyBonus: number
  hitPoints: { max: number; current: number }
  armorClass: number
  /** Seeded from the background at creation; grows on level-up. */
  skillProficiencies: SkillName[]
  /** Starts at True Neutral (0, 0); shifts through story choices. */
  alignment: Alignment
  /** Afflictions are personal, not party-shared. */
  curses: Curse[]
  /** Player-created vs. CPU-generated party member. Defaults to 'player'. */
  role: CharacterRole
}

export interface CreateCharacterInput {
  id: string
  name: string
  raceId: string
  classId: string
  backgroundId: string
  baseAbilityScores: AbilityScores
}

export function createCharacter(input: CreateCharacterInput): Character {
  const validation = validatePointBuy(input.baseAbilityScores)
  if (!validation.valid) {
    throw new Error(`invalid point-buy allocation: ${validation.errors.join('; ')}`)
  }

  const race = getRace(input.raceId)
  const characterClass = getCharacterClass(input.classId)
  const background = getBackground(input.backgroundId)

  const abilityScores = { ...input.baseAbilityScores }
  for (const name of ABILITY_NAMES) {
    abilityScores[name] += race.abilityScoreIncreases[name] ?? 0
  }

  const abilityModifiers = Object.fromEntries(
    ABILITY_NAMES.map((name) => [name, abilityModifier(abilityScores[name])]),
  ) as Record<AbilityName, number>

  const level = 1
  const maxHp = characterClass.hitDie + abilityModifiers.CON

  return {
    id: input.id,
    name: input.name,
    raceId: race.id,
    classId: characterClass.id,
    backgroundId: background.id,
    level,
    baseAbilityScores: input.baseAbilityScores,
    abilityScores,
    abilityModifiers,
    proficiencyBonus: proficiencyBonusForLevel(level),
    hitPoints: { max: maxHp, current: maxHp },
    armorClass: 10 + abilityModifiers.DEX,
    skillProficiencies: [...background.skillProficiencies],
    alignment: { moral: 0, ethical: 0 },
    curses: [],
    role: 'player',
  }
}
