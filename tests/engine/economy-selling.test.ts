import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import {
  canSellAsset,
  sellAsset,
  calculateResalePrice
} from '../../src/lib/game/engine/economy';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Asset Selling & Liquidation', () => {
  let sampleConfig: GameConfig;
  let state: GameState;

  beforeEach(() => {
    sampleConfig = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Andi', controller: 'HUMAN', color: '#10B981', tokenIcon: 'User' }
      ]
    };
    state = createGameState(sampleConfig);
    // Give Player 1 (Teddy) an asset (Kawasan Kos Mahasiswa, cost 1.200.000)
    state.ownerships.push({
      id: 'own-p1-asset-01',
      assetId: 'asset-tile-01',
      ownerPlayerId: state.players[0].id,
      purchasePrice: 1_200_000,
      acquiredRound: 1,
      acquiredAt: Date.now()
    });
    // Deduct cash from initial purchase
    state.players[0].balance = 8_800_000;
    state.phase = 'WAITING_ROLL';
  });

  it('calculates integer resale value strictly with 80% policy and Math.floor rounding', () => {
    // 1.200.000 * 0.8 = 960.000
    expect(calculateResalePrice(1_200_000, 80)).toBe(960_000);

    // Odd cost test: 1.234.567 * 80 / 100 = 987.653,6 -> 987.653 integer!
    expect(calculateResalePrice(1_234_567, 80)).toBe(987_653);
    expect(Number.isInteger(calculateResalePrice(1_234_567, 80))).toBe(true);

    // Zero or negative cost returns 0
    expect(calculateResalePrice(0, 80)).toBe(0);
    expect(calculateResalePrice(-500_000, 80)).toBe(0);
  });

  it('successfully liquidates an owned asset and credits cash proceeds', () => {
    const initialBalance = state.players[0].balance; // 8.800.000
    const assetId = 'asset-tile-01';

    const check = canSellAsset(state, assetId);
    expect(check.allowed).toBe(true);
    expect(check.resaleValue).toBe(960_000);

    const { state: nextState, transaction, resaleValue } = sellAsset(state, assetId);

    // 1. Resale value equals 80%
    expect(resaleValue).toBe(960_000);

    // 2. Player balance credited
    expect(nextState.players[0].balance).toBe(initialBalance + 960_000);

    // 3. Ownership removed
    expect(nextState.ownerships).toHaveLength(0);

    // 4. Transaction written
    expect(nextState.transactions).toHaveLength(1);
    expect(transaction.type).toBe('SELL_ASSET');
    expect(transaction.amount).toBe(960_000);
    expect(transaction.previousBalance).toBe(initialBalance);
    expect(transaction.resultingBalance).toBe(initialBalance + 960_000);

    // 5. Immutable state transition
    expect(state.ownerships).toHaveLength(1);
    expect(state.players[0].balance).toBe(initialBalance);
  });

  it('rejects attempt to sell an asset owned by another player', () => {
    const assetId = 'asset-tile-01';

    // Player 2 (Andi) attempts to sell Teddy's asset
    const check = canSellAsset(state, assetId, state.players[1].id);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Aset ini bukan milik Anda');

    expect(() => sellAsset(state, assetId, state.players[1].id)).toThrow(/Aset ini bukan milik Anda/);
    expect(state.ownerships).toHaveLength(1);
  });

  it('rejects attempt to sell an asset not owned by anyone', () => {
    const assetId = 'asset-tile-02'; // Pasar Rakyat (unowned)

    const check = canSellAsset(state, assetId, state.players[0].id);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Anda tidak memiliki aset ini');

    expect(() => sellAsset(state, assetId, state.players[0].id)).toThrow(/Anda tidak memiliki aset ini/);
  });

  it('rejects duplicate sale of an already-sold asset', () => {
    const assetId = 'asset-tile-01';

    // First sale succeeds
    const { state: soldState } = sellAsset(state, assetId);
    expect(soldState.ownerships).toHaveLength(0);

    // Immediate second sale must fail
    expect(() => sellAsset(soldState, assetId)).toThrow(/Anda tidak memiliki aset ini/);
  });

  it('rejects sale during active animation phases ROLLING and MOVING', () => {
    state.phase = 'ROLLING';
    const assetId = 'asset-tile-01';

    const check = canSellAsset(state, assetId);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('dadu sedang bergulir');

    expect(() => sellAsset(state, assetId)).toThrow(/dadu sedang bergulir/);
  });
});
