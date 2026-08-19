import {
  ABILITY_NAMES,
  POINT_BUY_BUDGET,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_MIN_SCORE,
  abilityModifier,
  pointBuyCost,
  validatePointBuy,
  type AbilityName,
  type AbilityScores,
} from '@tavern-tales/shared'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

interface AbilityScoreAllocatorProps {
  scores: AbilityScores
  onIncrement: (name: AbilityName) => void
  onDecrement: (name: AbilityName) => void
}

export function AbilityScoreAllocator({ scores, onIncrement, onDecrement }: AbilityScoreAllocatorProps) {
  const { pointsRemaining } = validatePointBuy(scores)

  return (
    <div className="ability-allocator">
      <p className="ability-allocator__budget">
        Points remaining: <strong>{pointsRemaining}</strong> / {POINT_BUY_BUDGET}
      </p>
      <table className="ability-allocator__table">
        <thead>
          <tr>
            <th>Ability</th>
            <th aria-hidden="true" />
            <th>Score</th>
            <th aria-hidden="true" />
            <th>Modifier</th>
          </tr>
        </thead>
        <tbody>
          {ABILITY_NAMES.map((name) => {
            const score = scores[name]
            const incrementCost = score < POINT_BUY_MAX_SCORE ? pointBuyCost(score + 1) - pointBuyCost(score) : Infinity
            const canIncrement = score < POINT_BUY_MAX_SCORE && incrementCost <= pointsRemaining
            const canDecrement = score > POINT_BUY_MIN_SCORE

            return (
              <tr key={name}>
                <td>{name}</td>
                <td>
                  <button type="button" onClick={() => onDecrement(name)} disabled={!canDecrement} aria-label={`Decrease ${name}`}>
                    −
                  </button>
                </td>
                <td className="ability-allocator__score">{score}</td>
                <td>
                  <button type="button" onClick={() => onIncrement(name)} disabled={!canIncrement} aria-label={`Increase ${name}`}>
                    +
                  </button>
                </td>
                <td>{formatModifier(abilityModifier(score))}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
