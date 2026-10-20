export interface Rng {
  /** Returns a floating point number in [0, 1) */
  next(): number;
  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number;
  /** Simulates rolling dice (default: 2 dice of 6 sides) */
  rollDice(count?: number, sides?: number): [number, number];
}

/**
 * Deterministic PRNG implementation using the Mulberry32 algorithm.
 */
export function createSeedableRng(seed: number): Rng {
  let state = seed >>> 0;

  function next(): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(next() * (hi - lo + 1)) + lo;
  }

  function rollDice(count: number = 2, sides: number = 6): [number, number] {
    const d1 = nextInt(1, sides);
    const d2 = count > 1 ? nextInt(1, sides) : 0;
    return [d1, d2];
  }

  return {
    next,
    nextInt,
    rollDice
  };
}

/**
 * Standard non-deterministic RNG using Math.random.
 */
export function createDefaultRng(): Rng {
  function next(): number {
    return Math.random();
  }

  function nextInt(min: number, max: number): number {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(next() * (hi - lo + 1)) + lo;
  }

  function rollDice(count: number = 2, sides: number = 6): [number, number] {
    const d1 = nextInt(1, sides);
    const d2 = count > 1 ? nextInt(1, sides) : 0;
    return [d1, d2];
  }

  return {
    next,
    nextInt,
    rollDice
  };
}
