import { ABILITY_NAMES, type AbilityScores } from './abilities.js'

// SRD 5.1 standard point-buy: 27 points, scores 8-15 before racial increases.
export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN_SCORE = 8
export const POINT_BUY_MAX_SCORE = 15

const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export function pointBuyCost(score: number): number {
  const cost = POINT_BUY_COSTS[score]
  if (cost === undefined) {
    throw new Error(`score ${score} is outside the point-buy range (${POINT_BUY_MIN_SCORE}-${POINT_BUY_MAX_SCORE})`)
  }
  return cost
}

export interface PointBuyValidation {
  valid: boolean
  pointsUsed: number
  pointsRemaining: number
  errors: string[]
}

export function validatePointBuy(scores: AbilityScores): PointBuyValidation {
  const errors: string[] = []
  let pointsUsed = 0

  for (const name of ABILITY_NAMES) {
    const score = scores[name]
    if (score < POINT_BUY_MIN_SCORE || score > POINT_BUY_MAX_SCORE) {
      errors.push(`${name} score ${score} must be between ${POINT_BUY_MIN_SCORE} and ${POINT_BUY_MAX_SCORE}`)
      continue
    }
    pointsUsed += pointBuyCost(score)
  }

  if (errors.length === 0 && pointsUsed > POINT_BUY_BUDGET) {
    errors.push(`allocation uses ${pointsUsed} points, exceeding the budget of ${POINT_BUY_BUDGET}`)
  }

  return {
    valid: errors.length === 0,
    pointsUsed,
    pointsRemaining: POINT_BUY_BUDGET - pointsUsed,
    errors,
  }
}
