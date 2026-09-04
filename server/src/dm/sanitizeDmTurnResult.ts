import type { DmAlignmentShift, DmHitPointChange, DmTurnResult } from '@tavern-tales/shared'

function readHitPointChange(input: Record<string, unknown>): DmHitPointChange | undefined {
  if (typeof input.hitPointDelta !== 'number' || typeof input.hitPointChangeReason !== 'string') {
    return undefined
  }
  return { delta: input.hitPointDelta, reason: input.hitPointChangeReason }
}

function readAlignmentShift(input: Record<string, unknown>): DmAlignmentShift | undefined {
  const hasMoralDelta = typeof input.moralDelta === 'number'
  const hasEthicalDelta = typeof input.ethicalDelta === 'number'
  if ((!hasMoralDelta && !hasEthicalDelta) || typeof input.alignmentShiftReason !== 'string') {
    return undefined
  }
  return {
    moralDelta: hasMoralDelta ? (input.moralDelta as number) : undefined,
    ethicalDelta: hasEthicalDelta ? (input.ethicalDelta as number) : undefined,
    reason: input.alignmentShiftReason,
  }
}

// narrate_turn's tool call is parsed here rather than trusted with a raw
// cast — see the comment on DM_TURN_TOOL in tool.ts for why: with more than
// one tool declared (always true in practice), a nested object in this
// tool's schema has been observed to reliably corrupt, so the schema itself
// is flat and this function reconstructs our internal nested shape from
// those flat fields, dropping anything that doesn't parse cleanly rather
// than passing corrupted data on to the client.
export function sanitizeDmTurnResult(raw: unknown): DmTurnResult {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return {
    narration: typeof input.narration === 'string' ? input.narration : '',
    suggestedChoices: Array.isArray(input.suggestedChoices)
      ? input.suggestedChoices.filter((choice): choice is string => typeof choice === 'string')
      : [],
    hitPointChange: readHitPointChange(input),
    alignmentShift: readAlignmentShift(input),
  }
}
