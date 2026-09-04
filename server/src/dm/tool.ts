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

export const DM_TURN_TOOL: Anthropic.Tool = {
  name: 'narrate_turn',
  description:
    'Narrate what happens next in the story and, only when something meaningfully harms or heals the ' +
    'player character, report the hit point change. This is the only way to affect the character — ' +
    'never describe a hit point change in narration without also reporting it here.',
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
      hitPointChange: {
        type: 'object',
        description: 'Only include this when the narration just described the character taking damage or healing.',
        properties: {
          delta: {
            type: 'integer',
            description: 'Positive to heal, negative to damage.',
          },
          reason: {
            type: 'string',
            description: 'Brief reason for the change, e.g. "grazed by a falling crate".',
          },
        },
        required: ['delta', 'reason'],
      },
    },
    required: ['narration', 'suggestedChoices'],
  },
}
