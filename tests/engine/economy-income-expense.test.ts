import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import { resolveTurnTile } from '../../src/lib/game/engine/game-engine';
import { executeRentPayment } from '../../src/lib/game/engine/economy';
import { calculateMovement } from '../../src/lib/game/engine/movement';
import { getAssetById } from '../../src/lib/game/data/assets';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Income, Rent & Fixed Expenses', () => {
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

  it('correctly transfers rental income from visitor to property owner', () => {
    // Player 2 (Andi) owns tile 1 (Kawasan Kos Mahasiswa: baseRent 160.000)
    const asset = getAssetById('asset-tile-01')!;
    state.ownerships.push({
      id: 'own-andi-01',
      assetId: asset.id,
      ownerPlayerId: state.players[1].id,
      purchasePrice: asset.cost,
      acquiredRound: 1,
      acquiredAt: Date.now()
    });

    const teddyInitial = state.players[0].balance;
    const andiInitial = state.players[1].balance;

    // Simulate Player 1 (Teddy) landing on tile 1
    state.players[0].position = 1;
    state.phase = 'RESOLVING_TILE';
    state.currentTurn = {
      playerId: state.players[0].id,
      dice: [1, 1],
      movement: calculateMovement(0, 1, 16)
    };

    const { state: resolvedState, resolution } = resolveTurnTile(state);

    // 1. Rent deducted from Teddy, added to Andi
    expect(resolvedState.players[0].balance).toBe(teddyInitial - 160_000);
    expect(resolvedState.players[1].balance).toBe(andiInitial + 160_000);

    // 2. Transactions recorded
    const visitorTx = resolvedState.transactions.find((t) => t.type === 'RENT_EXPENSE');
    const ownerTx = resolvedState.transactions.find((t) => t.type === 'RENT_INCOME');
    expect(visitorTx).toBeDefined();
    expect(visitorTx?.amount).toBe(160_000);
    expect(visitorTx?.playerId).toBe(state.players[0].id);

    expect(ownerTx).toBeDefined();
    expect(ownerTx?.amount).toBe(160_000);
    expect(ownerTx?.playerId).toBe(state.players[1].id);

    // 3. Resolution information contains owner details
    expect(resolution.headline).toContain('Andi');
    expect(resolution.financialImpact.amount).toBe(-160_000);
  });

  it('charges zero rent when active player visits their own property', () => {
    // Player 1 (Teddy) owns tile 1
    const asset = getAssetById('asset-tile-01')!;
    state.ownerships.push({
      id: 'own-teddy-01',
      assetId: asset.id,
      ownerPlayerId: state.players[0].id,
      purchasePrice: asset.cost,
      acquiredRound: 1,
      acquiredAt: Date.now()
    });

    const teddyInitial = state.players[0].balance;
    const andiInitial = state.players[1].balance;

    // Teddy lands on his own tile
    state.players[0].position = 1;
    state.phase = 'RESOLVING_TILE';
    state.currentTurn = {
      playerId: state.players[0].id,
      dice: [1, 1],
      movement: calculateMovement(0, 1, 16)
    };

    const { state: resolvedState, resolution } = resolveTurnTile(state);

    // Balances unchanged
    expect(resolvedState.players[0].balance).toBe(teddyInitial);
    expect(resolvedState.players[1].balance).toBe(andiInitial);
    expect(resolvedState.transactions.filter((t) => t.type === 'RENT_EXPENSE')).toHaveLength(0);
    expect(resolution.headline).toContain('Milik Sendiri');
  });

  it('handles insufficient funds without producing a negative cash balance', () => {
    const asset = getAssetById('asset-tile-15')!; // Kawasan CBD (baseRent: 900.000)
    const owner = state.players[1]; // Andi
    const visitor = state.players[0]; // Teddy
    // Teddy only has 250.000 cash remaining
    visitor.balance = 250_000;
    const andiInitial = owner.balance;

    const result = executeRentPayment(state, asset, owner, visitor);

    // 1. Teddy pays all 250.000, balance becomes exactly 0 (NOT negative!)
    expect(visitor.balance).toBe(0);
    expect(result.amountPaid).toBe(250_000);
    expect(result.unpaid).toBe(650_000);

    // 2. Owner receives only the actually collected cash
    expect(owner.balance).toBe(andiInitial + 250_000);

    // 3. Transactions explain the shortage
    expect(result.visitorTransaction.description).toContain('kas habis');
  });

  it('awards salary reward only once when passing start tile', () => {
    const initialBalance = state.players[0].balance;
    // Position at 14, moves 3 steps -> passes 0 -> lands on 1
    state.players[0].position = 14;

    const { state: resolved } = resolveTurnTile({
      ...state,
      phase: 'RESOLVING_TILE',
      currentTurn: {
        playerId: state.players[0].id,
        dice: [1, 2],
        movement: calculateMovement(14, 3, 16)
      }
    });

    // Tile resolution itself does not double-award salary (salary is awarded in finishMovement)
    expect(resolved.players[0].balance).toBe(initialBalance);
  });
});
