export interface RollD20Options {
  /** Injectable random source for deterministic tests. Must return a value in [0, 1). */
  random?: () => number
}

export function rollD20({ random = Math.random }: RollD20Options = {}): number {
  return Math.floor(random() * 20) + 1
}
