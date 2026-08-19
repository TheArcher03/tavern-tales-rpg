import Anthropic from '@anthropic-ai/sdk'
import { Router } from 'express'
import type { DmTurnRequest, DmTurnResult, StoryEntry } from '@tavern-tales/shared'
import { DM_TURN_TOOL } from './tool.js'
import { buildSystemPrompt } from './systemPrompt.js'

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5'

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

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: 'medium' },
      system: buildSystemPrompt(character),
      messages: [
        {
          role: 'user',
          content:
            `Story so far:\n${formatStoryLog(storyLog)}\n\n` +
            `The player now does: ${playerAction}\n\n` +
            'Narrate what happens next by calling narrate_turn.',
        },
      ],
      tools: [DM_TURN_TOOL],
    })

    if (message.stop_reason === 'refusal') {
      res.status(502).json({ error: 'The Dungeon Master declined to continue this scene.' })
      return
    }

    const toolUse = message.content.find((block) => block.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      res.status(502).json({ error: 'The Dungeon Master did not respond with a valid turn.' })
      return
    }

    const result = toolUse.input as DmTurnResult
    res.json(result)
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
