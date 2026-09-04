import type Anthropic from '@anthropic-ai/sdk'
import { ABILITY_NAMES, SKILL_ABILITIES } from '@tavern-tales/shared'

export const REQUEST_CHECK_TOOL: Anthropic.Tool = {
  name: 'request_check',
  description:
    'Call this BEFORE narrating an outcome that is genuinely uncertain — a skill check, ability check, ' +
    'or attack roll. Do not roll dice or decide success/failure yourself: the server rolls and computes ' +
    'the result, which you will then be given so you can call narrate_turn to describe what actually ' +
    'happens. Skip this for actions with no real chance of failure.',
  input_schema: {
    type: 'object',
    properties: {
      checkType: {
        type: 'string',
        enum: ['ability_check', 'attack'],
        description: '"attack" for a weapon or spell attack roll against a target\'s armor class; otherwise "ability_check".',
      },
      ability: {
        type: 'string',
        enum: [...ABILITY_NAMES],
        description: 'The ability score that applies. Ignored (and inferred instead) when skill is set.',
      },
      skill: {
        type: 'string',
        enum: Object.keys(SKILL_ABILITIES),
        description: 'The specific skill being used, if any (e.g. "Stealth"). Omit for a raw ability check or an attack.',
      },
      dc: {
        type: 'integer',
        description:
          'The difficulty class to beat, or the target\'s armor class for an attack. Typical DCs: 10 easy, ' +
          '13 medium, 16 hard, 19 very hard.',
      },
      reason: {
        type: 'string',
        description: 'Brief description of what is being attempted, e.g. "climb the crumbling wall".',
      },
    },
    required: ['checkType', 'ability', 'dc', 'reason'],
  },
}

export const LEVEL_UP_TOOL: Anthropic.Tool = {
  name: 'level_up',
  description:
    'Call this BEFORE narrating a level-up — only at a genuine story milestone (completing a significant ' +
    'goal, overcoming a notable threat), never routinely or more than once in a short span. Do not decide ' +
    "the character's new hit points or proficiency bonus yourself: the server rolls the class hit die and " +
    'computes both, which you will then be given so you can call narrate_turn to describe the moment.',
  input_schema: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'Brief description of the milestone that earned this level, e.g. "delivered the sealed letter to the shrine".',
      },
      newSkillProficiency: {
        type: 'string',
        enum: Object.keys(SKILL_ABILITIES),
        description:
          'Optional: a skill the character has grown into through this milestone and is not already ' +
          "proficient in. Omit if nothing fits — don't force one.",
      },
    },
    required: ['reason'],
  },
}

// Note: every field here is a flat scalar/array — no nested objects. With
// more than one tool declared on the request (which is always true in
// practice, since request_check/level_up are always offered alongside this
// one), a nested-object field here has been observed to reliably corrupt:
// the model emits stray tool-call-like syntax into the field instead of
// clean JSON, spilling sibling keys out to the top level of the tool input.
// Flattening every optional side effect into its own top-level field avoids
// the nested object entirely and reproduced cleanly in testing.
export const DM_TURN_TOOL: Anthropic.Tool = {
  name: 'narrate_turn',
  description:
    'Narrate what happens next in the story and report any resulting state changes — hit points and/or ' +
    'alignment. This is the only way those changes become real — never describe a hit point change or a ' +
    'shift in the character\'s moral standing in prose without also reporting it here.',
  input_schema: {
    type: 'object',
    properties: {
      narration: {
        type: 'string',
        description: 'What happens next, narrated in second person. One to three short paragraphs.',
      },
      suggestedChoices: {
        type: 'array',
        items: { type: 'string' },
        minItems: 2,
        maxItems: 4,
        description: 'Two to four short, concrete suggested next actions for the player.',
      },
      hitPointDelta: {
        type: 'integer',
        description:
          'Positive to heal, negative to damage. Only include this (and hitPointChangeReason) when the ' +
          'narration just described the character taking damage or healing.',
      },
      hitPointChangeReason: {
        type: 'string',
        description: 'Required alongside hitPointDelta — brief reason for the change, e.g. "grazed by a falling crate".',
      },
      moralDelta: {
        type: 'integer',
        description:
          'Shift toward good (positive) or evil (negative), typically 5 (minor) to 20 (major). Only ' +
          'include this (and alignmentShiftReason) when the character just made a genuinely ' +
          'alignment-defining choice — not a routine or morally trivial action. Most turns should omit ' +
          'this entirely.',
      },
      ethicalDelta: {
        type: 'integer',
        description:
          'Shift toward lawful (positive) or chaotic (negative), typically 5 (minor) to 20 (major). Only ' +
          'include alongside a genuinely alignment-defining choice, same as moralDelta.',
      },
      alignmentShiftReason: {
        type: 'string',
        description:
          'Required alongside moralDelta and/or ethicalDelta — brief reason for the shift, e.g. "spared a ' +
          'defeated enemy who begged for mercy".',
      },
    },
    required: ['narration', 'suggestedChoices'],
  },
}
