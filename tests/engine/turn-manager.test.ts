import { describe, it, expect } from 'vitest';
import { getNextActivePlayerIndex, isGameOver } from '../../src/lib/game/engine/turn-manager';
import type { Player } from '../../src/lib/game/domain/player';

describe('Turn Management Engine', () => {
  const mockPlayers: Player[] = [
    {
      id: 'p1',
      name: 'Pemain 1',
      controller: 'HUMAN',
      color: '#EF4444',
      tokenIcon: 'User',
      balance: 10_000_000,
      position: 0,
      netWorth: 10_000_000,
      isActive: true
    },
    {
      id: 'p2',
      name: 'Pemain 2',
      controller: 'HUMAN',
      color: '#10B981',
      tokenIcon: 'User',
      balance: 10_000_000,
      position: 0,
      netWorth: 10_000_000,
      isActive: true
    },
    {
      id: 'p3',
      name: 'Pemain 3',
      controller: 'AI',
      color: '#3B82F6',
      tokenIcon: 'Bot',
      balance: 10_000_000,
      position: 0,
      netWorth: 10_000_000,
      isActive: true
    }
  ];

  it('advances turn to the next player sequentially', () => {
    const turn1 = getNextActivePlayerIndex(mockPlayers, 0);
    expect(turn1.nextIndex).toBe(1);
    expect(turn1.wrappedAround).toBe(false);

    const turn2 = getNextActivePlayerIndex(mockPlayers, 1);
    expect(turn2.nextIndex).toBe(2);
    expect(turn2.wrappedAround).toBe(false);
  });

  it('wraps around to the first eligible player from the final player', () => {
    const turn = getNextActivePlayerIndex(mockPlayers, 2);
    expect(turn.nextIndex).toBe(0);
    expect(turn.wrappedAround).toBe(true);
  });

  it('correctly skips inactive or eliminated players', () => {
    const playersWithEliminated: Player[] = [
      { ...mockPlayers[0] },
      { ...mockPlayers[1], isActive: false }, // Player 2 eliminated
      { ...mockPlayers[2] }
    ];

    // From player 0, should skip player 1 and go straight to player 2
    const turn1 = getNextActivePlayerIndex(playersWithEliminated, 0);
    expect(turn1.nextIndex).toBe(2);
    expect(turn1.wrappedAround).toBe(false);

    // From player 2, should wrap around and skip player 1
    const turn2 = getNextActivePlayerIndex(playersWithEliminated, 2);
    expect(turn2.nextIndex).toBe(0);
    expect(turn2.wrappedAround).toBe(true);
  });

  it('detects game over when fewer than 2 active players remain', () => {
    expect(isGameOver(mockPlayers)).toBe(false);

    const singlePlayerLeft: Player[] = [
      { ...mockPlayers[0] },
      { ...mockPlayers[1], isActive: false },
      { ...mockPlayers[2], isActive: false }
    ];
    expect(isGameOver(singlePlayerLeft)).toBe(true);
  });

  it('rejects invalid player index or empty player list', () => {
    expect(() => getNextActivePlayerIndex([], 0)).toThrow(/Daftar pemain kosong/);
    expect(() => getNextActivePlayerIndex(mockPlayers, -1)).toThrow(/tidak valid/);
    expect(() => getNextActivePlayerIndex(mockPlayers, 5)).toThrow(/tidak valid/);
  });
});
