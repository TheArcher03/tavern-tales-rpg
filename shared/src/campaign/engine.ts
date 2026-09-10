import { ABILITY_SCORE_MAX, abilityModifier, type AbilityName } from '../abilities.js'
import { alignmentLabel, shiftAlignment } from '../alignment.js'
import { getCharacterClass } from '../characterClass.js'
import { resolveCheck } from '../check.js'
import type { Character } from '../character.js'
import { resolveLevelUp } from '../leveling.js'
import { CLASS_PRIORITY_ABILITIES, pickRandom } from './companion.js'
import type { PartyState } from './partyState.js'
import type { Choice, EncounterChoice, EffectTarget, PartySlot, SceneCondition, SceneEffect, ShopOffer } from './types.js'

export const SLOT_INDEX: Record<PartySlot, number> = {
  pc1: 0,
  pc2: 1,
  companion1: 2,
  companion2: 3,
}

function resolveTargetIndices(party: PartyState, target: EffectTarget, random: () => number): number[] {
  if (target === 'party') return [0, 1, 2, 3]
  if (target === 'random') return [Math.floor(random() * party.members.length)]
  return [SLOT_INDEX[target]]
}

function formatSignedModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function mapMembers(party: PartyState, indices: number[], transform: (member: Character) => Character): PartyState {
  const members = party.members.map((member, index) =>
    indices.includes(index) ? transform(member) : member,
  ) as PartyState['members']
  return { ...party, members }
}

function namesFor(party: PartyState, indices: number[]): string {
  return indices.map((index) => party.members[index].name).join(' and ')
}

export interface EffectOutcome {
  party: PartyState
  log?: string
  /** Names of members whose HP was reduced to 0 by this specific effect. */
  deaths?: string[]
}

// Applies one authored effect and returns the updated party plus a
// player-facing log line (mirrors the formatting the old live-DM StoryShell
// used for check/level-up/alignment results, just resolved locally).
export function applyEffect(party: PartyState, effect: SceneEffect, random: () => number = Math.random): EffectOutcome {
  switch (effect.type) {
    case 'grantGold':
      return { party: { ...party, sharedGold: party.sharedGold + effect.amount }, log: `💰 +${effect.amount} gold.` }

    case 'grantItem':
      return {
        party: { ...party, sharedTreasure: [...party.sharedTreasure, effect.item] },
        log: `🎁 Found: ${effect.item.name} — ${effect.item.description}`,
      }

    case 'grantCurse': {
      const indices = resolveTargetIndices(party, effect.target, random)
      const next = mapMembers(party, indices, (member) => ({ ...member, curses: [...member.curses, effect.curse] }))
      const verb = indices.length > 1 ? 'are' : 'is'
      return { party: next, log: `💀 ${namesFor(party, indices)} ${verb} cursed: ${effect.curse.name} — ${effect.curse.description}` }
    }

    case 'removeCurse': {
      const indices = resolveTargetIndices(party, effect.target, random)
      const next = mapMembers(party, indices, (member) => ({
        ...member,
        curses: member.curses.filter((curse) => curse.id !== effect.curseId),
      }))
      return { party: next, log: `✨ ${namesFor(party, indices)} — a curse is lifted.` }
    }

    case 'hitPointChange': {
      const indices = resolveTargetIndices(party, effect.target, random)
      const deaths: string[] = []
      const next = mapMembers(party, indices, (member) => {
        const nextCurrent = Math.max(0, Math.min(member.hitPoints.max, member.hitPoints.current + effect.delta))
        const diesNow = nextCurrent === 0 && member.status === 'alive'
        if (diesNow) deaths.push(member.name)
        return {
          ...member,
          hitPoints: { ...member.hitPoints, current: nextCurrent },
          status: diesNow ? 'dead' : member.status,
        }
      })
      const icon = effect.delta >= 0 ? '💚' : '💥'
      const verb = effect.delta >= 0 ? 'heals' : 'takes damage'
      return {
        party: next,
        log: `${icon} ${namesFor(party, indices)} ${verb} (${formatSignedModifier(effect.delta)}) — ${effect.reason}`,
        deaths: deaths.length > 0 ? deaths : undefined,
      }
    }

    case 'alignmentShift': {
      const indices = resolveTargetIndices(party, effect.target, random)
      const next = mapMembers(party, indices, (member) => ({
        ...member,
        alignment: shiftAlignment(member.alignment, effect.moralDelta, effect.ethicalDelta),
      }))
      const parts: string[] = []
      if (effect.moralDelta) parts.push(`${formatSignedModifier(effect.moralDelta)} moral`)
      if (effect.ethicalDelta) parts.push(`${formatSignedModifier(effect.ethicalDelta)} ethical`)
      const resultLabel = alignmentLabel(next.members[indices[0]].alignment)
      return {
        party: next,
        log: `⚖️ ${namesFor(party, indices)}: ${parts.join(', ')} — ${effect.reason}. Now: ${resultLabel}.`,
      }
    }

    case 'levelUp': {
      const indices = resolveTargetIndices(party, effect.target, random)
      let logLine = ''
      const next = mapMembers(party, indices, (member) => {
        const characterClass = getCharacterClass(member.classId)
        const result = resolveLevelUp({
          currentLevel: member.level,
          hitDie: characterClass.hitDie,
          conModifier: member.abilityModifiers.CON,
          random,
        })
        const skillNote =
          effect.newSkillProficiency && !member.skillProficiencies.includes(effect.newSkillProficiency)
            ? `, gained proficiency in ${effect.newSkillProficiency}`
            : ''
        logLine +=
          (logLine ? ' ' : '') +
          `⭐ ${member.name} reaches level ${result.newLevel} — +${result.hitPointsGained} max HP, ` +
          `proficiency bonus +${result.newProficiencyBonus}${skillNote}.`
        return {
          ...member,
          level: result.newLevel,
          proficiencyBonus: result.newProficiencyBonus,
          hitPoints: { max: member.hitPoints.max + result.hitPointsGained, current: member.hitPoints.current + result.hitPointsGained },
          skillProficiencies:
            effect.newSkillProficiency && !member.skillProficiencies.includes(effect.newSkillProficiency)
              ? [...member.skillProficiencies, effect.newSkillProficiency]
              : member.skillProficiencies,
        }
      })
      return { party: next, log: logLine }
    }

    case 'setFlag':
      return { party: { ...party, storyFlags: { ...party.storyFlags, [effect.flag]: effect.value ?? true } } }
  }
}

export function applyEffects(
  party: PartyState,
  effects: SceneEffect[],
  random: () => number = Math.random,
): { party: PartyState; logs: string[]; deaths: string[] } {
  let next = party
  const logs: string[] = []
  const deaths: string[] = []
  for (const effect of effects) {
    const outcome = applyEffect(next, effect, random)
    next = outcome.party
    if (outcome.log) logs.push(outcome.log)
    if (outcome.deaths) deaths.push(...outcome.deaths)
  }
  return { party: next, logs, deaths }
}

export function isChoiceAvailable(party: PartyState, condition?: SceneCondition): boolean {
  if (!condition) return true
  const actual = party.storyFlags[condition.flag] ?? false
  return actual === (condition.equals ?? true)
}

export interface ChoiceOutcome {
  party: PartyState
  logs: string[]
  nextSceneId: string
  deaths: string[]
}

export function resolveChoice(party: PartyState, choice: Choice, random: () => number = Math.random): ChoiceOutcome {
  const { party: next, logs, deaths } = applyEffects(party, choice.effects ?? [], random)
  return { party: next, logs, nextSceneId: choice.next, deaths }
}

export interface EncounterOutcome extends ChoiceOutcome {
  success: boolean
  checkLog: string
}

// Picks who actually attempts an encounter choice: the authored actor, or —
// if that member has died — the living party member with the best modifier
// for the check's ability instead. This is the entire "no softlock" death
// design: existing encounter content never needs to be rewritten, because
// a dead actor is only ever a preference, never a hard requirement. Exported
// so the client can preview who will actually act (e.g. to label a choice
// button) without duplicating this logic or waiting for resolution.
export function resolveActingMember(party: PartyState, choice: EncounterChoice): Character {
  const preferred = party.members[SLOT_INDEX[choice.actor]]
  if (preferred.status === 'alive') return preferred

  const living = party.members.filter((member) => member.status === 'alive')
  if (living.length === 0) return preferred // party-wiped is handled by the caller before this can matter

  return living.reduce((best, candidate) =>
    candidate.abilityModifiers[choice.ability] > best.abilityModifiers[choice.ability] ? candidate : best,
  )
}

// Resolves one encounter approach: a single real dice check by the acting
// party member against the encounter's DC, then applies whichever effect
// list matches the outcome.
export function resolveEncounterChoice(
  party: PartyState,
  choice: EncounterChoice,
  random: () => number = Math.random,
): EncounterOutcome {
  const actor = resolveActingMember(party, choice)
  const proficient = choice.skill ? actor.skillProficiencies.includes(choice.skill) : false
  const check = resolveCheck({
    abilityScore: actor.abilityScores[choice.ability],
    dc: choice.dc,
    proficient,
    proficiencyBonus: actor.proficiencyBonus,
    random,
  })

  const label = choice.skill ? `${choice.skill} check` : `${choice.ability} check`
  const checkLog = `🎲 ${actor.name} — ${label}: rolled ${check.roll} ${formatSignedModifier(check.modifier)} = ${check.total} vs DC ${check.dc} — ${check.success ? 'Success!' : 'Failure.'}`

  const effects = check.success ? (choice.successEffects ?? []) : (choice.failureEffects ?? [])
  const { party: next, logs, deaths } = applyEffects(party, effects, random)

  return {
    party: next,
    logs,
    checkLog,
    success: check.success,
    nextSceneId: check.success ? choice.successNext : choice.failureNext,
    deaths,
  }
}

// Bumps one ability score by 1 (capped at ABILITY_SCORE_MAX — the real SRD
// ceiling, not the lower point-buy creation cap), recomputing the derived
// modifier and, for DEX, armor class. No retroactive HP change: matches how
// the SRD only grants HP at the moment of leveling, not from ability
// increases made after the fact.
export function applyAbilityIncrease(party: PartyState, target: PartySlot, ability: AbilityName): PartyState {
  return mapMembers(party, [SLOT_INDEX[target]], (member) => {
    const nextScore = Math.min(ABILITY_SCORE_MAX, member.abilityScores[ability] + 1)
    const abilityScores = { ...member.abilityScores, [ability]: nextScore }
    const abilityModifiers = { ...member.abilityModifiers, [ability]: abilityModifier(nextScore) }
    return {
      ...member,
      abilityScores,
      abilityModifiers,
      armorClass: ability === 'DEX' ? 10 + abilityModifiers.DEX : member.armorClass,
    }
  })
}

// Picks a level-up ability for a CPU-controlled companion — weighted
// toward that class's priority abilities (the same heuristic
// generateCompanion already uses to build them), "strategically
// randomized" per the class's persona rather than a single fixed pick.
export function autoAssignCompanionAbilityIncrease(character: Character, random: () => number = Math.random): AbilityName {
  const priority = CLASS_PRIORITY_ABILITIES[character.classId]
  return priority && priority.length > 0 ? pickRandom(priority, random) : 'CON'
}

// Buys one shop offer: deducts gold, grants the item (if any) and/or
// applies immediate effects (if any). Refuses (and leaves the party
// unchanged) if the party can't afford it — the client should also disable
// the buy button proactively; this is the defensive backstop.
export function resolvePurchase(
  party: PartyState,
  offer: ShopOffer,
  random: () => number = Math.random,
): { party: PartyState; logs: string[]; success: boolean } {
  if (party.sharedGold < offer.cost) {
    return { party, logs: [`You can't afford ${offer.name} (${offer.cost} gold).`], success: false }
  }

  const afterPayment: PartyState = { ...party, sharedGold: party.sharedGold - offer.cost }
  const effects: SceneEffect[] = [
    ...(offer.item ? [{ type: 'grantItem' as const, item: offer.item }] : []),
    ...(offer.effects ?? []),
  ]
  const { party: next, logs } = applyEffects(afterPayment, effects, random)
  return { party: next, logs: [`🛒 Bought ${offer.name} for ${offer.cost} gold.`, ...logs], success: true }
}

// Consumes one usable item from the shared treasury by id, applying its
// effects. Removes only the single matched array entry (by index, not a
// filter on id) so duplicate items sharing an id — e.g. two Healing
// Draughts bought separately — don't all vanish when one is used. Returns
// null if the item isn't found or isn't usable (the client only offers
// "Use" for usable items, so this is a defensive guard, not a real path).
export function useItem(
  party: PartyState,
  itemId: string,
  random: () => number = Math.random,
): { party: PartyState; logs: string[] } | null {
  const index = party.sharedTreasure.findIndex((item) => item.id === itemId)
  if (index === -1) return null
  const item = party.sharedTreasure[index]
  if (!item.usable) return null

  const withoutItem: PartyState = {
    ...party,
    sharedTreasure: [...party.sharedTreasure.slice(0, index), ...party.sharedTreasure.slice(index + 1)],
  }
  const { party: next, logs } = applyEffects(withoutItem, item.usable.effects, random)
  return { party: next, logs: [item.usable.useNarration, ...logs] }
}
