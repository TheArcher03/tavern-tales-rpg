import type { DmTurnRequest, DmTurnResult } from '@tavern-tales/shared'

export async function requestDmTurn(request: DmTurnRequest): Promise<DmTurnResult> {
  const response = await fetch('/api/dm/turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `The Dungeon Master request failed (status ${response.status}).`)
  }

  return response.json() as Promise<DmTurnResult>
}
