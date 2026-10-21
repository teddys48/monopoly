import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import {
  purchaseAsset,
  sellAsset,
  calculatePlayerAssetValuation,
  calculatePlayerNetWorth
} from '../../src/lib/game/engine/economy';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Valuation, Net Worth & Portfolio', () => {
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
  });

  it('calculates initial net worth equal to starting cash balance with zero assets', () => {
    const p1 = state.players[0];
    const valuation = calculatePlayerAssetValuation(p1.id, state.ownerships);
    const netWorth = calculatePlayerNetWorth(p1, state.ownerships);

    expect(valuation).toBe(0);
    expect(p1.balance).toBe(10_000_000);
    expect(netWorth).toBe(10_000_000);
  });

  it('preserves net worth after asset purchase under acquisition-cost valuation policy', () => {
    // Teddy lands on tile 1 (cost: 1.200.000)
    state.phase = 'TURN_COMPLETE';
    state.players[0].position = 1;

    const { state: afterBuy } = purchaseAsset(state, 'asset-tile-01');
    const p1 = afterBuy.players[0];

    // Cash decreased by 1.2M -> 8.8M
    expect(p1.balance).toBe(8_800_000);

    // Asset valuation equals 1.2M
    const valuation = calculatePlayerAssetValuation(p1.id, afterBuy.ownerships);
    expect(valuation).toBe(1_200_000);

    // Net worth = 8.8M + 1.2M = 10.0M (Unchanged book value!)
    const netWorth = calculatePlayerNetWorth(p1, afterBuy.ownerships);
    expect(netWorth).toBe(10_000_000);
    expect(p1.netWorth).toBe(10_000_000);
  });

  it('updates valuation and net worth correctly under resale value policy', () => {
    state.phase = 'TURN_COMPLETE';
    state.players[0].position = 1;

    const { state: afterBuy } = purchaseAsset(state, 'asset-tile-01');
    const p1 = afterBuy.players[0];

    // Under resale valuation policy (80% of 1.2M = 960k)
    const resaleValuation = calculatePlayerAssetValuation(p1.id, afterBuy.ownerships, 'RESALE_VALUE');
    expect(resaleValuation).toBe(960_000);

    const liquidationNetWorth = calculatePlayerNetWorth(p1, afterBuy.ownerships, 'RESALE_VALUE');
    expect(liquidationNetWorth).toBe(8_800_000 + 960_000); // 9.760.000
  });

  it('correctly tracks portfolio and net worth across multiple purchases and sales', () => {
    // 1. Teddy buys tile 1 (1.200.000)
    state.phase = 'TURN_COMPLETE';
    state.players[0].position = 1;
    let s = purchaseAsset(state, 'asset-tile-01').state;

    // 2. Teddy moves to tile 2 (1.800.000) and buys it
    s.players[0].position = 2;
    s = purchaseAsset(s, 'asset-tile-02').state;

    // Teddy now owns 2 assets: total cost = 3.000.000. Cash = 7.000.000. Net worth = 10.000.000
    expect(s.ownerships).toHaveLength(2);
    expect(s.players[0].balance).toBe(7_000_000);
    expect(calculatePlayerAssetValuation(s.players[0].id, s.ownerships)).toBe(3_000_000);
    expect(s.players[0].netWorth).toBe(10_000_000);

    // 3. Teddy sells tile 1 (receives 80% of 1.2M = 960.000)
    s = sellAsset(s, 'asset-tile-01').state;

    // Ownership count is 1 (only tile 2 remaining)
    expect(s.ownerships).toHaveLength(1);
    expect(s.ownerships[0].assetId).toBe('asset-tile-02');

    // Balance = 7.000.000 + 960.000 = 7.960.000
    expect(s.players[0].balance).toBe(7_960_000);

    // Remaining valuation = 1.800.000
    expect(calculatePlayerAssetValuation(s.players[0].id, s.ownerships)).toBe(1_800_000);

    // Net worth = 7.960.000 + 1.800.000 = 9.760.000
    expect(s.players[0].netWorth).toBe(9_760_000);
  });

  it('keeps players portfolios completely isolated from one another', () => {
    // Teddy buys tile 1
    state.phase = 'TURN_COMPLETE';
    state.players[0].position = 1;
    let s = purchaseAsset(state, 'asset-tile-01').state;

    // Switch to Andi (player 1) and Andi buys tile 2 (1.800.000)
    s.activePlayerIndex = 1;
    s.players[1].position = 2;
    s = purchaseAsset(s, 'asset-tile-02', s.players[1].id).state;

    const teddyValuation = calculatePlayerAssetValuation(s.players[0].id, s.ownerships);
    const andiValuation = calculatePlayerAssetValuation(s.players[1].id, s.ownerships);

    expect(teddyValuation).toBe(1_200_000);
    expect(andiValuation).toBe(1_800_000);

    expect(s.players[0].balance).toBe(8_800_000);
    expect(s.players[1].balance).toBe(8_200_000);
  });
});
