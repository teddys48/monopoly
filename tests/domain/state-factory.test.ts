import { describe, it, expect } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('createGameState', () => {
  const validConfig: GameConfig = {
    mode: 'BOT',
    playerCount: 2,
    startingBalance: 10_000_000,
    players: [
      { name: 'Siti', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
      { name: 'Pak Budi (Bot)', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
    ]
  };

  it('constructs a valid initial game state with correct defaults', () => {
    const state = createGameState(validConfig);

    expect(state.id).toBeDefined();
    expect(state.players).toHaveLength(2);
    expect(state.activePlayerIndex).toBe(0);
    expect(state.currentRound).toBe(1);
    expect(state.phase).toBe('WAITING_ROLL');
    expect(state.selectedTileIndex).toBe(0);
    expect(state.statusLog.length).toBeGreaterThan(0);

    // Player 1
    const p1 = state.players[0];
    expect(p1.name).toBe('Siti');
    expect(p1.controller).toBe('HUMAN');
    expect(p1.balance).toBe(10_000_000);
    expect(p1.position).toBe(0);
    expect(p1.isActive).toBe(true);

    // Player 2
    const p2 = state.players[1];
    expect(p2.name).toBe('Pak Budi (Bot)');
    expect(p2.controller).toBe('AI');
    expect(p2.balance).toBe(10_000_000);
    expect(p2.position).toBe(0);
  });

  it('throws an error when supplied with an invalid configuration', () => {
    const invalidConfig = {
      ...validConfig,
      playerCount: 1,
      players: [validConfig.players[0]]
    };

    expect(() => createGameState(invalidConfig)).toThrowError(/Konfigurasi permainan tidak valid/);
  });

  it('preserves independence of board tiles and prevents external mutation of templates', () => {
    const state = createGameState(validConfig);
    state.board[0].name = 'Modified Name';

    const freshState = createGameState(validConfig);
    expect(freshState.board[0].name).not.toBe('Modified Name');
  });
});
