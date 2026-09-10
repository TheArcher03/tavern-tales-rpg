import { alignmentLabel, shiftAlignment } from '../alignment.js'
import { getCharacterClass } from '../characterClass.js'
import { resolveCheck } from '../check.js'
import type { Character } from '../character.js'
import { resolveLevelUp } from '../leveling.js'
import type { PartyState } from './partyState.js'
import type { Choice, EncounterChoice, EffectTarget, SceneCondition, SceneEffect } from './types.js'

const SLOT_INDEX: Record<'pc1' | 'pc2' | 'companion1' | 'companion2', number> = {
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
      const next = mapMembers(party, indices, (member) => {
        const nextCurrent = Math.max(0, Math.min(member.hitPoints.max, member.hitPoints.current + effect.delta))
        return { ...member, hitPoints: { ...member.hitPoints, current: nextCurrent } }
      })
      const icon = effect.delta >= 0 ? '💚' : '💥'
      const verb = effect.delta >= 0 ? 'heals' : 'takes damage'
      return {
        party: next,
        log: `${icon} ${namesFor(party, indices)} ${verb} (${formatSignedModifier(effect.delta)}) — ${effect.reason}`,
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
): { party: PartyState; logs: string[] } {
  let next = party
  const logs: string[] = []
  for (const effect of effects) {
    const outcome = applyEffect(next, effect, random)
    next = outcome.party
    if (outcome.log) logs.push(outcome.log)
  }
  return { party: next, logs }
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
}

export function resolveChoice(party: PartyState, choice: Choice, random: () => number = Math.random): ChoiceOutcome {
  const { party: next, logs } = applyEffects(party, choice.effects ?? [], random)
  return { party: next, logs, nextSceneId: choice.next }
}

export interface EncounterOutcome extends ChoiceOutcome {
  success: boolean
  checkLog: string
}

// Resolves one encounter approach: a single real dice check by the named
// actor against the encounter's DC, then applies whichever effect list
// matches the outcome.
export function resolveEncounterChoice(
  party: PartyState,
  choice: EncounterChoice,
  random: () => number = Math.random,
): EncounterOutcome {
  const actor = party.members[SLOT_INDEX[choice.actor]]
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
  const { party: next, logs } = applyEffects(party, effects, random)

  return {
    party: next,
    logs,
    checkLog,
    success: check.success,
    nextSceneId: check.success ? choice.successNext : choice.failureNext,
  }
}
