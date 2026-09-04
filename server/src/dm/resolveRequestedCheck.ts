import {
  ABILITY_NAMES,
  SKILL_ABILITIES,
  isSkillName,
  resolveCheck,
  type AbilityName,
  type Character,
  type DmCheckResult,
  type DmCheckType,
} from '@tavern-tales/shared'

export interface RequestCheckInput {
  checkType: string
  ability: string
  skill?: string
  dc: number
  reason: string
}

function isAbilityName(value: string): value is AbilityName {
  return (ABILITY_NAMES as readonly string[]).includes(value)
}

// Tool-call inputs aren't strictly schema-validated, so this defensively
// re-derives the ability from a known skill (rather than trusting whatever
// ability the model paired it with) and falls back to STR for anything
// unrecognized, instead of throwing mid-turn.
export function resolveRequestedCheck(character: Character, input: RequestCheckInput): DmCheckResult {
  const checkType: DmCheckType = input.checkType === 'attack' ? 'attack' : 'ability_check'
  const skill = input.skill && isSkillName(input.skill) ? input.skill : undefined
  const ability: AbilityName = skill ? SKILL_ABILITIES[skill] : isAbilityName(input.ability) ? input.ability : 'STR'

  // Skill proficiency is the character's own (growable) list — seeded from
  // the background at creation, but no longer tied to it, since level-ups
  // can add to it. Attacks assume proficiency with whatever weapon is in
  // use — per-weapon proficiency tracking isn't modeled yet.
  const proficient = skill ? character.skillProficiencies.includes(skill) : checkType === 'attack'

  const result = resolveCheck({
    abilityScore: character.abilityScores[ability],
    dc: input.dc,
    proficient,
    proficiencyBonus: character.proficiencyBonus,
  })

  return { ...result, checkType, ability, skill, reason: input.reason }
}
