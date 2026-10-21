import { describe, it, expect } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import {
  rollDice,
  startMovement,
  finishMovement,
  resolveTurnTile,
  endTurn
} from '../../src/lib/game/engine/game-engine';
import {
  purchaseAsset,
  declinePurchase,
  sellAsset,
  canPurchaseAsset
} from '../../src/lib/game/engine/economy';
import { GAME_CONSTANTS } from '../../src/lib/game/rules/constants';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — End-to-End Gameplay Integration', () => {
  const botConfig: GameConfig = {
    mode: 'BOT',
    playerCount: 2,
    startingBalance: 10_000_000,
    players: [
      { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
      { name: 'Pak Budi (Bot)', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
    ]
  };

  it('completes a full human turn with movement, unowned asset offer, and purchase', () => {
    const state = createGameState(botConfig);
    expect(state.phase).toBe('WAITING_ROLL');

    // 1. Teddy rolls dice: 1 + 1 = 2 (Lands on tile 2: Pasar Rakyat Tradisional, cost 1.800.000)
    const { state: rolled } = rollDice(state, { dice: [1, 1] });
    const moving = startMovement(rolled);
    const finished = finishMovement(moving);
    expect(finished.players[0].position).toBe(2);

    // 2. Tile Resolution detects unowned asset and provides purchase opportunity
    const { state: resolved, resolution } = resolveTurnTile(finished);
    expect(resolved.phase).toBe('TURN_COMPLETE');
    expect(resolved.currentTurn?.pendingPurchase).toBeDefined();
    expect(resolved.currentTurn?.pendingPurchase?.id).toBe('asset-tile-02');
    expect(resolution.headline).toContain('Peluang Akuisisi');

    // 3. Player accepts purchase
    const { state: purchased } = purchaseAsset(resolved, 'asset-tile-02');
    expect(purchased.players[0].balance).toBe(10_000_000 - 1_800_000);
    expect(purchased.ownerships).toHaveLength(1);
    expect(purchased.currentTurn?.pendingPurchase).toBeNull();

    // 4. End turn transitions smoothly to Bot
    const nextState = endTurn(purchased);
    expect(nextState.phase).toBe('READY');
    expect(nextState.activePlayerIndex).toBe(1); // Switched to Pak Budi
    expect(nextState.ownerships).toHaveLength(1); // Ownership is preserved!
  });

  it('allows declining an asset purchase and ending turn without balance change', () => {
    const state = createGameState(botConfig);

    // Roll 1 + 2 = 3
    const { state: rolled } = rollDice(state, { dice: [1, 2] });
    const moving = startMovement(rolled);
    const finished = finishMovement(moving);
    const { state: resolved } = resolveTurnTile(finished);

    expect(resolved.currentTurn?.pendingPurchase).toBeDefined();

    // Player declines purchase
    const declined = declinePurchase(resolved);
    expect(declined.currentTurn?.pendingPurchase).toBeNull();
    expect(declined.players[0].balance).toBe(10_000_000);
    expect(declined.ownerships).toHaveLength(0);

    // Player ends turn cleanly
    const nextState = endTurn(declined);
    expect(nextState.activePlayerIndex).toBe(1);
  });

  it('applies identical purchase and sale validation rules to AI bot as human players', () => {
    const state = createGameState(botConfig);
    // Switch turn to Bot (index 1)
    state.activePlayerIndex = 1;
    state.phase = 'TURN_COMPLETE';
    state.players[1].position = 1; // Tile 1 (cost: 1.200.000)

    const bot = state.players[1];
    const check = canPurchaseAsset(state, 'asset-tile-01');
    expect(check.allowed).toBe(true);

    // Bot affordability rule: bot.balance - asset.cost >= BOT_MIN_CASH_RESERVE (1.000.000)
    expect(bot.balance - 1_200_000).toBeGreaterThanOrEqual(GAME_CONSTANTS.BOT_MIN_CASH_RESERVE);

    // Bot executes purchase using the identical pure engine action
    const { state: botPurchased } = purchaseAsset(state, 'asset-tile-01');
    expect(botPurchased.ownerships).toHaveLength(1);
    expect(botPurchased.ownerships[0].ownerPlayerId).toBe(bot.id);
    expect(botPurchased.players[1].balance).toBe(8_800_000);

    // Bot can also sell asset with same rules
    const { state: botSold } = sellAsset(botPurchased, 'asset-tile-01');
    expect(botSold.ownerships).toHaveLength(0);
    expect(botSold.players[1].balance).toBe(8_800_000 + 960_000);
  });

  it('charges human rent when human visits a property owned by the AI bot', () => {
    const state = createGameState(botConfig);
    // Bot owns tile 2 (Pasar Rakyat Tradisional: baseRent 240.000)
    state.ownerships.push({
      id: 'own-bot-02',
      assetId: 'asset-tile-02',
      ownerPlayerId: state.players[1].id,
      purchasePrice: 1_800_000,
      acquiredRound: 1,
      acquiredAt: Date.now()
    });
    state.players[1].balance = 8_200_000;

    // Human (Teddy) rolls 1 + 1 = 2 (0 -> 2)
    const { state: rolled } = rollDice(state, { dice: [1, 1] });
    const moving = startMovement(rolled);
    const finished = finishMovement(moving);
    const { state: resolved } = resolveTurnTile(finished);

    // Human pays 240.000 to Bot
    expect(resolved.players[0].balance).toBe(10_000_000 - 240_000);
    expect(resolved.players[1].balance).toBe(8_200_000 + 240_000);
    expect(resolved.currentTurn?.rentPaid?.amount).toBe(240_000);
    expect(resolved.currentTurn?.rentPaid?.ownerName).toBe('Pak Budi (Bot)');
  });
});
