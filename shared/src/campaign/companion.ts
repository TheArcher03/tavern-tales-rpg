import { ABILITY_NAMES, type AbilityName, type AbilityScores } from '../abilities.js'
import { BACKGROUNDS } from '../background.js'
import { CHARACTER_CLASSES } from '../characterClass.js'
import { createCharacter, type Character } from '../character.js'
import { POINT_BUY_BUDGET, POINT_BUY_MAX_SCORE, POINT_BUY_MIN_SCORE, pointBuyCost } from '../pointBuy.js'
import { RACES } from '../race.js'

// Rough "primary abilities" per class, used only to weight CPU allocation —
// not a mechanical rule, just a flavor heuristic.
const CLASS_PRIORITY_ABILITIES: Record<string, AbilityName[]> = {
  fighter: ['STR', 'CON'],
  wizard: ['INT', 'CON'],
  rogue: ['DEX', 'INT'],
  cleric: ['WIS', 'CON'],
}

function pickRandom<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

// Simple greedy allocator: spends the point-buy budget maxing out priority
// abilities first, then whatever's left over the rest, in ABILITY_NAMES
// order. Always produces a valid (in-budget) allocation; the exact spread
// is a starting point, not a tuned "smart NPC build."
function allocateCompanionAbilityScores(priority: AbilityName[]): AbilityScores {
  const scores = Object.fromEntries(ABILITY_NAMES.map((name) => [name, POINT_BUY_MIN_SCORE])) as AbilityScores
  let remaining = POINT_BUY_BUDGET
  const order = [...priority, ...ABILITY_NAMES.filter((name) => !priority.includes(name))]

  for (const name of order) {
    while (scores[name] < POINT_BUY_MAX_SCORE) {
      const nextCost = pointBuyCost(scores[name] + 1) - pointBuyCost(scores[name])
      if (nextCost > remaining) break
      scores[name] += 1
      remaining -= nextCost
    }
  }

  return scores
}

export interface GenerateCompanionInput {
  id: string
  name: string
  /** classIds already taken by the player's characters, so the companion fills a gap. */
  existingClassIds: string[]
  random?: () => number
}

// A CPU-generated party member: fills whichever core class isn't already
// covered by the player's two picks (falls back to any class if all four
// are already represented), then spends the full point-buy budget weighted
// toward that class's primary abilities. Goes through the same
// createCharacter validation path a player character does.
export function generateCompanion({ id, name, existingClassIds, random = Math.random }: GenerateCompanionInput): Character {
  const uncoveredClasses = CHARACTER_CLASSES.filter((characterClass) => !existingClassIds.includes(characterClass.id))
  const characterClass = pickRandom(uncoveredClasses.length > 0 ? uncoveredClasses : CHARACTER_CLASSES, random)
  const race = pickRandom(RACES, random)
  const background = pickRandom(BACKGROUNDS, random)
  const priority = CLASS_PRIORITY_ABILITIES[characterClass.id] ?? []

  const character = createCharacter({
    id,
    name,
    raceId: race.id,
    classId: characterClass.id,
    backgroundId: background.id,
    baseAbilityScores: allocateCompanionAbilityScores(priority),
  })

  return { ...character, role: 'companion' }
}
