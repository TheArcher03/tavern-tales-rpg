import { getCharacterClass, isSkillName, resolveLevelUp, type Character, type DmLevelUpResult } from '@tavern-tales/shared'

export interface LevelUpToolInput {
  reason: string
  newSkillProficiency?: string
}

// Throws if the character is already at the level cap — the route decides
// how to recover from that rather than resolving it here.
export function resolveRequestedLevelUp(character: Character, input: LevelUpToolInput): DmLevelUpResult {
  const characterClass = getCharacterClass(character.classId)

  const { newLevel, hitPointsGained, newProficiencyBonus } = resolveLevelUp({
    currentLevel: character.level,
    hitDie: characterClass.hitDie,
    conModifier: character.abilityModifiers.CON,
  })

  const newSkillProficiency =
    input.newSkillProficiency &&
    isSkillName(input.newSkillProficiency) &&
    !character.skillProficiencies.includes(input.newSkillProficiency)
      ? input.newSkillProficiency
      : undefined

  return { newLevel, hitPointsGained, newProficiencyBonus, newSkillProficiency, reason: input.reason }
}
