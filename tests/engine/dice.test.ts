import { describe, it, expect } from 'vitest';
import { createDefaultRng, createSeedableRng } from '../../src/lib/game/engine/rng';
import { rollDice } from '../../src/lib/game/engine/game-engine';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Two-Dice System', () => {
  const sampleConfig: GameConfig = {
    mode: 'BOT',
    playerCount: 2,
    startingBalance: 10_000_000,
    players: [
      { name: 'Pemain 1', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
      { name: 'Pak Budi (Bot)', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
    ]
  };

  it('both dice always return integers from 1 to 6 over 1000 rolls', () => {
    const rng = createDefaultRng();
    for (let i = 0; i < 1000; i++) {
      const [d1, d2] = rng.rollDice(2, 6);
      expect(Number.isInteger(d1)).toBe(true);
      expect(Number.isInteger(d2)).toBe(true);
      expect(d1).toBeGreaterThanOrEqual(1);
      expect(d1).toBeLessThanOrEqual(6);
      expect(d2).toBeGreaterThanOrEqual(1);
      expect(d2).toBeLessThanOrEqual(6);
    }
  });

  it('the movement total always equals the sum of the two dice', () => {
    const state = createGameState(sampleConfig);
    const rng = createDefaultRng();

    for (let i = 0; i < 50; i++) {
      const freshState = { ...state, phase: 'READY' as const };
      const { dice, movement } = rollDice(freshState, { rng });
      expect(movement.steps).toBe(dice[0] + dice[1]);
    }
  });

  it('seeded randomness produces reproducible, identical dice outcomes', () => {
    const seed = 123456789;
    const rng1 = createSeedableRng(seed);
    const rng2 = createSeedableRng(seed);

    const rolls1 = Array.from({ length: 20 }, () => rng1.rollDice(2, 6));
    const rolls2 = Array.from({ length: 20 }, () => rng2.rollDice(2, 6));

    expect(rolls1).toEqual(rolls2);
  });

  it('injected dice rolls in the game engine produce expected outcomes', () => {
    const state = createGameState(sampleConfig);
    const { dice, movement, state: rolledState } = rollDice(state, { dice: [4, 3] });

    expect(dice).toEqual([4, 3]);
    expect(movement.steps).toBe(7);
    expect(rolledState.lastDiceRoll).toEqual([4, 3]);
  });

  it('rejects invalid injected dice values', () => {
    const state = createGameState(sampleConfig);

    expect(() => rollDice(state, { dice: [0, 4] })).toThrow(/Nilai dadu tidak valid/);
    expect(() => rollDice(state, { dice: [7, 3] })).toThrow(/Nilai dadu tidak valid/);
    expect(() => rollDice(state, { dice: [2.5 as unknown as number, 3] })).toThrow(
      /Nilai dadu tidak valid/
    );
  });
});
