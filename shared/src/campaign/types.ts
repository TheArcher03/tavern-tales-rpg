import type { AbilityName } from '../abilities.js'
import type { Curse } from '../curse.js'
import type { Item } from '../item.js'
import type { SkillName } from '../skills.js'

// Fixed party composition: two player-created characters, two CPU-generated
// companions. Content authors target effects at a slot rather than an id,
// since character ids don't exist yet when a scene is written.
export type PartySlot = 'pc1' | 'pc2' | 'companion1' | 'companion2'
export type EffectTarget = PartySlot | 'party' | 'random'

export type SceneEffect =
  | { type: 'grantGold'; amount: number }
  | { type: 'grantItem'; item: Item }
  | { type: 'grantCurse'; target: EffectTarget; curse: Curse }
  | { type: 'removeCurse'; target: EffectTarget; curseId: string }
  | { type: 'hitPointChange'; target: EffectTarget; delta: number; reason: string }
  | { type: 'alignmentShift'; target: EffectTarget; moralDelta?: number; ethicalDelta?: number; reason: string }
  | { type: 'levelUp'; target: EffectTarget; newSkillProficiency?: SkillName }
  | { type: 'setFlag'; flag: string; value?: boolean }

// A choice is only offered when the named flag's current value matches
// `equals` (defaults to true) — the mechanism side quests use to gate a
// later branch on earlier progress.
export interface SceneCondition {
  flag: string
  equals?: boolean
}

export interface Choice {
  label: string
  next: string
  effects?: SceneEffect[]
  condition?: SceneCondition
}

// Marks a scene as the start of a new act. The client shows a full-screen
// splash (completedTitle, if given, above enteringTitle) before revealing
// this scene's narration/choices.
export interface ChapterBreak {
  completedTitle?: string
  enteringTitle: string
  enteringSubtitle?: string
}

export interface NarrationScene {
  type: 'narration'
  id: string
  narration: string
  choices: Choice[]
  chapterBreak?: ChapterBreak
}

export interface MonsterStatBlock {
  name: string
  description: string
  ac: number
  hp: number
}

// Encounters are abstracted, not round-by-round: each choice is one check
// attempt by a named party member against the monster's stats, resolved
// with the same shared/check.ts math as everything else, branching to a
// distinct success/failure scene rather than ticking down monster HP turn
// by turn.
export interface EncounterChoice {
  label: string
  actor: PartySlot
  ability: AbilityName
  skill?: SkillName
  dc: number
  successNext: string
  failureNext: string
  successEffects?: SceneEffect[]
  failureEffects?: SceneEffect[]
  condition?: SceneCondition
}

export interface EncounterScene {
  type: 'encounter'
  id: string
  narration: string
  monster: MonsterStatBlock
  choices: EncounterChoice[]
}

export interface EndingScene {
  type: 'ending'
  id: string
  title: string
  narration: string
}

// A shop's wares. Buying either grants an item to the shared treasury
// (item?) or applies effects immediately (effects?, e.g. a fortune-teller's
// reading) — an offer may do either or both.
export interface ShopOffer {
  id: string
  name: string
  description: string
  cost: number
  item?: Item
  effects?: SceneEffect[]
}

export interface ShopScene {
  type: 'shop'
  id: string
  narration: string
  /** Display name for who's selling, e.g. "A Traveling Peddler". */
  shopkeeper: string
  offers: ShopOffer[]
  /** How to leave the shop — reuses the same gated-choice machinery as narration scenes. */
  choices: Choice[]
}

export type Scene = NarrationScene | EncounterScene | EndingScene | ShopScene

export type Campaign = Record<string, Scene>
