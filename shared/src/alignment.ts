export interface Alignment {
  /** Good (positive) vs. evil (negative). */
  moral: number
  /** Lawful (positive) vs. chaotic (negative). */
  ethical: number
}

export const ALIGNMENT_MIN = -100
export const ALIGNMENT_MAX = 100

// Within this distance of 0 on either axis counts as "Neutral" for that axis.
const NEUTRAL_BAND = 33

export type MoralLabel = 'Good' | 'Neutral' | 'Evil'
export type EthicalLabel = 'Lawful' | 'Neutral' | 'Chaotic'

export function moralLabel(moral: number): MoralLabel {
  if (moral > NEUTRAL_BAND) return 'Good'
  if (moral < -NEUTRAL_BAND) return 'Evil'
  return 'Neutral'
}

export function ethicalLabel(ethical: number): EthicalLabel {
  if (ethical > NEUTRAL_BAND) return 'Lawful'
  if (ethical < -NEUTRAL_BAND) return 'Chaotic'
  return 'Neutral'
}

// The classic 9-cell D&D alignment name derived from the two axes.
export function alignmentLabel(alignment: Alignment): string {
  const moral = moralLabel(alignment.moral)
  const ethical = ethicalLabel(alignment.ethical)
  if (moral === 'Neutral' && ethical === 'Neutral') return 'True Neutral'
  if (moral === 'Neutral') return `${ethical} Neutral`
  if (ethical === 'Neutral') return `Neutral ${moral}`
  return `${ethical} ${moral}`
}

export function clampAlignmentValue(value: number): number {
  return Math.max(ALIGNMENT_MIN, Math.min(ALIGNMENT_MAX, value))
}

export function shiftAlignment(alignment: Alignment, moralDelta = 0, ethicalDelta = 0): Alignment {
  return {
    moral: clampAlignmentValue(alignment.moral + moralDelta),
    ethical: clampAlignmentValue(alignment.ethical + ethicalDelta),
  }
}
