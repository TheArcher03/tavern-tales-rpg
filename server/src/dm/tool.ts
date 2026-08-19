import type Anthropic from '@anthropic-ai/sdk'

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
