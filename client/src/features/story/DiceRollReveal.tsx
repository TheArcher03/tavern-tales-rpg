import { useEffect, useRef, useState } from 'react'

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

interface DiceRollRevealProps {
  actorName: string
  checkLabel: string
  dc: number
  roll: number
  modifier: number
  total: number
  success: boolean
  onContinue: () => void
}

const ROLL_DURATION_MS = 1100
const CYCLE_INTERVAL_MS = 70

// Dramatizes the single check every encounter choice already resolves —
// the real roll is computed immediately (no mechanic changes), this just
// delays revealing it: a d20 spins through random faces, then settles on
// the actual result with a success/failure beat. Clicking the die during
// the spin skips straight to the reveal for players who don't want to
// wait every time.
export function DiceRollReveal({ actorName, checkLabel, dc, roll, modifier, total, success, onContinue }: DiceRollRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [face, setFace] = useState(1)
  const revealedRef = useRef(false)

  useEffect(() => {
    const cycle = setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), CYCLE_INTERVAL_MS)
    const settle = setTimeout(() => {
      revealedRef.current = true
      setRevealed(true)
    }, ROLL_DURATION_MS)
    return () => {
      clearInterval(cycle)
      clearTimeout(settle)
    }
  }, [])

  const skipToReveal = () => {
    if (revealedRef.current) return
    revealedRef.current = true
    setRevealed(true)
  }

  return (
    <div className="dice-roll">
      <p className="dice-roll__actor">
        {actorName} — {checkLabel}
      </p>
      <button
        type="button"
        className={`dice-roll__die${revealed ? (success ? ' dice-roll__die--success' : ' dice-roll__die--failure') : ' dice-roll__die--spinning'}`}
        onClick={skipToReveal}
        aria-label={revealed ? `Rolled ${roll}` : 'Rolling — click to skip'}
      >
        {revealed ? roll : face}
      </button>
      {revealed ? (
        <>
          <p className="dice-roll__breakdown">
            {roll} {formatModifier(modifier)} = {total} vs DC {dc}
          </p>
          <p className={`dice-roll__result${success ? ' dice-roll__result--success' : ' dice-roll__result--failure'}`}>
            {success ? 'Success!' : 'Failure.'}
          </p>
          <button type="button" onClick={onContinue}>
            Continue
          </button>
        </>
      ) : (
        <p className="dice-roll__breakdown">vs DC {dc}</p>
      )}
    </div>
  )
}
