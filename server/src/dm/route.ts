import Anthropic from '@anthropic-ai/sdk'
import { Router } from 'express'
import type { DmCheckResult, DmLevelUpResult, DmTurnRequest, DmTurnResult, StoryEntry } from '@tavern-tales/shared'
import { DM_TURN_TOOL, LEVEL_UP_TOOL, REQUEST_CHECK_TOOL } from './tool.js'
import { buildSystemPrompt } from './systemPrompt.js'
import { resolveRequestedCheck, type RequestCheckInput } from './resolveRequestedCheck.js'
import { resolveRequestedLevelUp, type LevelUpToolInput } from './resolveRequestedLevelUp.js'
import { sanitizeDmTurnResult } from './sanitizeDmTurnResult.js'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'

// A request_check round trip and/or a level_up round trip, then narrate_turn,
// covers the normal case; this just leaves room for an unusual turn without
// letting a confused model loop forever.
const MAX_ITERATIONS = 6

function formatStoryLog(storyLog: StoryEntry[]): string {
  if (storyLog.length === 0) return '(The adventure has not yet begun.)'
  return storyLog.map((entry) => `${entry.speaker.toUpperCase()}: ${entry.text}`).join('\n')
}

function isDmTurnRequest(body: unknown): body is DmTurnRequest {
  if (typeof body !== 'object' || body === null) return false
  const candidate = body as Partial<DmTurnRequest>
  return (
    typeof candidate.character === 'object' &&
    candidate.character !== null &&
    Array.isArray(candidate.storyLog) &&
    typeof candidate.playerAction === 'string' &&
    candidate.playerAction.trim().length > 0
  )
}

export const dmRouter = Router()

dmRouter.post('/turn', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' })
    return
  }

  if (!isDmTurnRequest(req.body)) {
    res.status(400).json({ error: 'Request must include character, storyLog, and a non-empty playerAction.' })
    return
  }

  const { character, storyLog, playerAction } = req.body
  const client = new Anthropic({ apiKey })

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content:
        `Story so far:\n${formatStoryLog(storyLog)}\n\n` +
        `The player now does: ${playerAction}\n\n` +
        'Respond by calling request_check or level_up (if warranted) or narrate_turn.',
    },
  ]

  let checkResult: DmCheckResult | undefined
  let levelUpResult: DmLevelUpResult | undefined

  try {
    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: { effort: 'medium' },
        system: buildSystemPrompt(character),
        messages,
        tools: [REQUEST_CHECK_TOOL, LEVEL_UP_TOOL, DM_TURN_TOOL],
      })

      if (message.stop_reason === 'refusal') {
        res.status(502).json({ error: 'The Dungeon Master declined to continue this scene.' })
        return
      }

      const toolUse = message.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      )
      if (!toolUse) {
        res.status(502).json({ error: 'The Dungeon Master did not respond with a valid turn.' })
        return
      }

      if (toolUse.name === DM_TURN_TOOL.name) {
        const result = sanitizeDmTurnResult(toolUse.input)
        res.json({ ...result, checkResult, levelUpResult } satisfies DmTurnResult)
        return
      }

      if (toolUse.name === REQUEST_CHECK_TOOL.name) {
        checkResult = resolveRequestedCheck(character, toolUse.input as RequestCheckInput)
        messages.push({ role: 'assistant', content: message.content })
        messages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(checkResult) }],
        })
        continue
      }

      if (toolUse.name === LEVEL_UP_TOOL.name) {
        messages.push({ role: 'assistant', content: message.content })
        try {
          levelUpResult = resolveRequestedLevelUp(character, toolUse.input as LevelUpToolInput)
          messages.push({
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(levelUpResult) }],
          })
        } catch (levelUpErr) {
          const errorMessage = levelUpErr instanceof Error ? levelUpErr.message : 'Could not level up.'
          messages.push({
            role: 'user',
            content: [{ type: 'tool_result', tool_use_id: toolUse.id, content: errorMessage, is_error: true }],
          })
        }
        continue
      }

      res.status(502).json({ error: 'The Dungeon Master called an unexpected tool.' })
      return
    }

    res.status(502).json({ error: 'The Dungeon Master could not resolve this turn.' })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      res.status(502).json({ error: 'The server’s Anthropic API key was rejected.' })
      return
    }
    if (err instanceof Anthropic.RateLimitError) {
      res.status(502).json({ error: 'The Dungeon Master is busy right now — try again shortly.' })
      return
    }
    console.error('DM turn failed:', err)
    res.status(502).json({ error: 'The Dungeon Master could not be reached.' })
  }
})
