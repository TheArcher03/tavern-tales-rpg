import type { Campaign } from './types.js'

// Structural checks only (dangling scene references, empty choice lists) —
// not content review. Meant to run against every act as it's written.
export function findCampaignErrors(campaign: Campaign): string[] {
  const errors: string[] = []
  const sceneIds = new Set(Object.keys(campaign))

  const checkTarget = (sourceId: string, targetId: string, label: string) => {
    if (!sceneIds.has(targetId)) {
      errors.push(`${sourceId}: ${label} references missing scene "${targetId}"`)
    }
  }

  for (const [id, scene] of Object.entries(campaign)) {
    if (scene.id !== id) {
      errors.push(`scene keyed "${id}" has mismatched internal id "${scene.id}"`)
    }

    if (scene.type === 'narration' || scene.type === 'shop') {
      if (scene.choices.length === 0) {
        errors.push(`${id}: ${scene.type} scene has no choices — use type "ending" if that's intentional`)
      }
      for (const choice of scene.choices) {
        checkTarget(id, choice.next, `choice "${choice.label}"`)
      }
    } else if (scene.type === 'encounter') {
      if (scene.choices.length === 0) {
        errors.push(`${id}: encounter scene has no choices`)
      }
      for (const choice of scene.choices) {
        checkTarget(id, choice.successNext, `choice "${choice.label}" successNext`)
        checkTarget(id, choice.failureNext, `choice "${choice.label}" failureNext`)
      }
    }
  }

  return errors
}

// Scenes not reachable by any path from the starting scene(s) — usually a
// sign of a typo'd scene id or an orphaned draft scene left in the file.
// Accepts multiple start ids so scenes that are only reachable dynamically
// at runtime (e.g. a safety-net ending StoryShell routes to directly, never
// via an authored choice) can be seeded as additional roots rather than
// flagged as false positives.
export function findUnreachableScenes(campaign: Campaign, startSceneIds: string | string[]): string[] {
  const visited = new Set<string>()
  const queue: string[] = Array.isArray(startSceneIds) ? [...startSceneIds] : [startSceneIds]

  while (queue.length > 0) {
    const id = queue.shift() as string
    if (visited.has(id)) continue
    const scene = campaign[id]
    if (!scene) continue
    visited.add(id)

    if (scene.type === 'narration' || scene.type === 'shop') {
      for (const choice of scene.choices) queue.push(choice.next)
    } else if (scene.type === 'encounter') {
      for (const choice of scene.choices) {
        queue.push(choice.successNext)
        queue.push(choice.failureNext)
      }
    }
  }

  return Object.keys(campaign).filter((id) => !visited.has(id))
}
