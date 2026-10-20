import { describe, it, expect } from 'vitest';
import { createSeedableRng, createDefaultRng } from '../../src/lib/game/engine/rng';

describe('Random Number Generator (RNG)', () => {
  it('produces identical deterministic sequences for the same seed', () => {
    const rng1 = createSeedableRng(123456);
    const rng2 = createSeedableRng(123456);

    const rolls1 = [rng1.rollDice(), rng1.rollDice(), rng1.rollDice()];
    const rolls2 = [rng2.rollDice(), rng2.rollDice(), rng2.rollDice()];

    expect(rolls1).toEqual(rolls2);
  });

  it('produces distinct sequences for different seeds', () => {
    const rng1 = createSeedableRng(1111);
    const rng2 = createSeedableRng(9999);

    const val1 = [rng1.next(), rng1.next(), rng1.next()];
    const val2 = [rng2.next(), rng2.next(), rng2.next()];

    expect(val1).not.toEqual(val2);
  });

  it('rolls 2 dice within the valid bounds [1, 6]', () => {
    const rng = createDefaultRng();

    for (let i = 0; i < 50; i++) {
      const [d1, d2] = rng.rollDice();
      expect(d1).toBeGreaterThanOrEqual(1);
      expect(d1).toBeLessThanOrEqual(6);
      expect(d2).toBeGreaterThanOrEqual(1);
      expect(d2).toBeLessThanOrEqual(6);
    }
  });

  it('generates integers correctly within custom range', () => {
    const rng = createSeedableRng(42);
    for (let i = 0; i < 30; i++) {
      const val = rng.nextInt(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });
});
