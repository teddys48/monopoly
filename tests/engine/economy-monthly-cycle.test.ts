import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import { processMonthlySettlement } from '../../src/lib/game/engine/monthly-settlement';
import { executeFullTurn } from '../../src/lib/game/engine/game-engine';
import { ECONOMIC_CONSTANTS } from '../../src/lib/game/rules/constants';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Monthly Cycle & Settlement', () => {
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

  it('initializes game with month 1 and zero settled months', () => {
    expect(state.currentMonth).toBe(1);
    expect(state.lastSettledMonth).toBe(0);
    expect(state.indicators.currentMonth).toBe(1);
    expect(state.indicators.inflationIndex).toBe(1.0);
    expect(state.settlements).toHaveLength(0);
  });

  it('processes monthly settlement applying salary, living expenses, and tax exactly once', () => {
    const p1Initial = state.players[0].balance;
    const initialMonth = state.currentMonth;

    const settledState = processMonthlySettlement(state);

    // 1. Month counter advanced
    expect(settledState.lastSettledMonth).toBe(initialMonth);
    expect(settledState.currentMonth).toBe(initialMonth + 1);

    // 2. Expected financial flow for Player 1:
    // + Salary (4,000,000)
    // - Living Expenses: 1,200,000 (housing) + 1,000,000 (food) + 400,000 (transport) + 400,000 (utilities) = 3,000,000
    // - Tax (5% of 4,000,000) = 200,000
    // Net cash flow = +4,000,000 - 3,000,000 - 200,000 = +800,000
    const expectedBalance = p1Initial + 4_000_000 - 3_000_000 - 200_000;
    expect(settledState.players[0].balance).toBe(expectedBalance);

    // 3. Transactions recorded
    const salaryTx = settledState.transactions.find((t) => t.type === 'MONTHLY_SALARY');
    const expenseTx = settledState.transactions.find((t) => t.type === 'MONTHLY_LIVING_EXPENSE');
    const taxTx = settledState.transactions.find((t) => t.type === 'MONTHLY_TAX');

    expect(salaryTx).toBeDefined();
    expect(salaryTx?.amount).toBe(ECONOMIC_CONSTANTS.DEFAULT_MONTHLY_SALARY);
    expect(expenseTx).toBeDefined();
    expect(expenseTx?.amount).toBe(3_000_000);
    expect(taxTx).toBeDefined();
    expect(taxTx?.amount).toBe(200_000);

    // 4. Monthly settlement summary recorded
    expect(settledState.settlements).toHaveLength(1);
    const summary = settledState.settlements[0];
    expect(summary.month).toBe(1);
    expect(summary.playerSettlements).toHaveLength(2);
    expect(summary.playerSettlements[0].income.salary).toBe(4_000_000);
    expect(summary.playerSettlements[0].expenses.living).toBe(3_000_000);
    expect(summary.playerSettlements[0].taxPaid).toBe(200_000);
  });

  it('guarantees strict idempotence: repeated settlement for the same month is a no-op', () => {
    const firstSettled = processMonthlySettlement(state);
    const p1BalanceAfterFirst = firstSettled.players[0].balance;
    const txCountAfterFirst = firstSettled.transactions.length;
    const settlementsCountAfterFirst = firstSettled.settlements.length;

    // Attempting to settle month 1 again
    const secondSettled = processMonthlySettlement(firstSettled, { monthOverride: 1 });

    expect(secondSettled.players[0].balance).toBe(p1BalanceAfterFirst);
    expect(secondSettled.transactions.length).toBe(txCountAfterFirst);
    expect(secondSettled.settlements.length).toBe(settlementsCountAfterFirst);
  });

  it('automatically triggers monthly settlement upon round wraparound in game engine', () => {
    expect(state.currentRound).toBe(1);
    expect(state.currentMonth).toBe(1);
    expect(state.lastSettledMonth).toBe(0);

    // Turn 1: Player 0 takes turn
    let next = executeFullTurn(state, { dice: [1, 2] });
    expect(next.activePlayerIndex).toBe(1);
    expect(next.currentRound).toBe(1);
    expect(next.currentMonth).toBe(1); // Round not finished yet

    // Turn 2: Player 1 takes turn -> wraps around to Player 0!
    next = executeFullTurn(next, { dice: [2, 2] });
    expect(next.activePlayerIndex).toBe(0);
    expect(next.currentRound).toBe(2);
    // Month was automatically settled!
    expect(next.lastSettledMonth).toBe(1);
    expect(next.currentMonth).toBe(2);
    expect(next.settlements).toHaveLength(1);
  });

  it('skips inactive or eliminated players during monthly settlement without breaking cycle', () => {
    state.players[1].isActive = false; // Player 2 eliminated
    const p1Initial = state.players[0].balance;

    const settledState = processMonthlySettlement(state);

    expect(settledState.players[0].balance).toBe(p1Initial + 800_000);
    // Inactive player received 0 income and paid 0 expenses
    expect(settledState.settlements[0].playerSettlements).toHaveLength(1);
    expect(settledState.settlements[0].playerSettlements[0].playerId).toBe(state.players[0].id);
  });
});
