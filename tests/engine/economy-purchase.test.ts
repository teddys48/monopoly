import { describe, it, expect, beforeEach } from 'vitest';
import { calculateMovement } from '../../src/lib/game/engine/movement';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import {
  canPurchaseAsset,
  purchaseAsset,
  declinePurchase
} from '../../src/lib/game/engine/economy';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Asset Purchasing', () => {
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
    // Simulate player finishing movement on tile 1 (Kawasan Kos Mahasiswa, cost 1.200.000)
    state.phase = 'TURN_COMPLETE';
    state.players[0].position = 1;
  });

  it('successfully purchases an available asset on the active tile', () => {
    const initialBalance = state.players[0].balance;
    const assetId = 'asset-tile-01';

    const check = canPurchaseAsset(state, assetId);
    expect(check.allowed).toBe(true);
    expect(check.cost).toBe(1_200_000);

    const { state: nextState, transaction, ownership } = purchaseAsset(state, assetId);

    // 1. Balance deducted correctly
    expect(nextState.players[0].balance).toBe(initialBalance - 1_200_000);

    // 2. Ownership recorded
    expect(nextState.ownerships).toHaveLength(1);
    expect(ownership.assetId).toBe(assetId);
    expect(ownership.ownerPlayerId).toBe(state.players[0].id);
    expect(ownership.purchasePrice).toBe(1_200_000);
    expect(ownership.acquiredRound).toBe(1);

    // 3. Transaction recorded
    expect(nextState.transactions).toHaveLength(1);
    expect(transaction.type).toBe('PURCHASE_ASSET');
    expect(transaction.amount).toBe(1_200_000);
    expect(transaction.previousBalance).toBe(initialBalance);
    expect(transaction.resultingBalance).toBe(initialBalance - 1_200_000);
    expect(transaction.playerId).toBe(state.players[0].id);

    // 4. Original state was not mutated (immutable state transition)
    expect(state.ownerships).toHaveLength(0);
    expect(state.players[0].balance).toBe(initialBalance);
  });

  it('rejects purchase when player has insufficient cash balance', () => {
    // Set balance lower than asset cost (1.200.000)
    state.players[0].balance = 500_000;
    const assetId = 'asset-tile-01';

    const check = canPurchaseAsset(state, assetId);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Saldo kas tidak mencukupi');

    expect(() => purchaseAsset(state, assetId)).toThrow(/Saldo kas tidak mencukupi/);
    expect(state.ownerships).toHaveLength(0);
    expect(state.players[0].balance).toBe(500_000);
  });

  it('rejects purchase if asset is already owned by another player', () => {
    const assetId = 'asset-tile-01';
    // Pre-own the asset with Player 2 (Andi)
    state.ownerships.push({
      id: 'own-existing',
      assetId,
      ownerPlayerId: state.players[1].id,
      purchasePrice: 1_200_000,
      acquiredRound: 1,
      acquiredAt: Date.now()
    });

    const check = canPurchaseAsset(state, assetId);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('sudah dimiliki');

    expect(() => purchaseAsset(state, assetId)).toThrow(/sudah dimiliki/);
  });

  it('rejects purchase when submitted for an inactive or non-turn player', () => {
    const assetId = 'asset-tile-01';

    // Player 2 (Andi) attempts to buy during Player 1's turn
    const check = canPurchaseAsset(state, assetId, state.players[1].id);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Bukan giliran Anda');

    expect(() => purchaseAsset(state, assetId, state.players[1].id)).toThrow(/Bukan giliran Anda/);
  });

  it('rejects purchase if player is not standing on the asset tile', () => {
    // Player 1 is at tile 0 (START), but tries to buy asset on tile 1
    state.players[0].position = 0;
    const assetId = 'asset-tile-01';

    const check = canPurchaseAsset(state, assetId);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Pemain berada di petak #0');

    expect(() => purchaseAsset(state, assetId)).toThrow(/Pemain berada di petak #0/);
  });

  it('rejects purchase during invalid turn phases such as ROLLING or MOVING', () => {
    state.phase = 'ROLLING';
    const assetId = 'asset-tile-01';

    const check = canPurchaseAsset(state, assetId);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('fase: ROLLING');

    expect(() => purchaseAsset(state, assetId)).toThrow(/fase: ROLLING/);
  });

  it('rejects duplicate purchase submission of the same asset', () => {
    const assetId = 'asset-tile-01';

    // First purchase succeeds
    const { state: boughtState } = purchaseAsset(state, assetId);
    expect(boughtState.ownerships).toHaveLength(1);

    // Immediate second purchase must be rejected
    expect(() => purchaseAsset(boughtState, assetId)).toThrow(/sudah dimiliki/);
  });

  it('declining purchase clears pending purchase without modifying balance or ownership', () => {
    const initialBalance = state.players[0].balance;
    state.currentTurn = {
      playerId: state.players[0].id,
      dice: [1, 1],
      movement: calculateMovement(0, 1, 16),
      pendingPurchase: {
        id: 'asset-tile-01',
        tileId: 'tile-01',
        tileIndex: 1,
        name: 'Kawasan Kos Mahasiswa',
        shortName: 'Kawasan Kos',
        category: 'RESIDENSIAL',
        description: 'Kos',
        cost: 1_200_000,
        baseRent: 160_000,
        resalePolicy: { type: 'PERCENTAGE', percentage: 80 },
        icon: 'Home',
        colorBadge: '#0284C7'
      }
    };

    const declinedState = declinePurchase(state);
    expect(declinedState.currentTurn?.pendingPurchase).toBeNull();
    expect(declinedState.players[0].balance).toBe(initialBalance);
    expect(declinedState.ownerships).toHaveLength(0);
    expect(declinedState.statusLog[0].message).toContain('tidak membeli');
  });
});
