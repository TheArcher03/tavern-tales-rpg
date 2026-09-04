export interface RollD20Options {
  /** Injectable random source for deterministic tests. Must return a value in [0, 1). */
  random?: () => number
}

export function rollDie(sides: number, { random = Math.random }: RollD20Options = {}): number {
  return Math.floor(random() * sides) + 1
}

export function rollD20(options: RollD20Options = {}): number {
  return rollDie(20, options)
}
