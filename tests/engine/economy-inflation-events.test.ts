import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import { processMonthlySettlement } from '../../src/lib/game/engine/monthly-settlement';
import {
  triggerEconomicEvent,
  selectRandomEconomicEvent,
} from '../../src/lib/game/engine/economic-events';
import { createSeedableRng } from '../../src/lib/game/engine/rng';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Inflation, Events, Employment & THR Bonus', () => {
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

  describe('Inflation Mechanics', () => {
    it('updates inflation index monotonically each month according to configured rate', () => {
      expect(state.indicators.inflationIndex).toBe(1.0);
      expect(state.indicators.currentInflationRate).toBe(0.005); // 0.5% / month

      const m1Settled = processMonthlySettlement(state);
      // 1.0 * (1 + 0.005) = 1.005
      expect(m1Settled.indicators.inflationIndex).toBe(1.005);

      const m2Settled = processMonthlySettlement(m1Settled);
      // 1.005 * 1.005 = 1.010025 -> rounded to 1.0100
      expect(m2Settled.indicators.inflationIndex).toBe(1.01);
    });

    it('scales living expenses with inflation while keeping historical transactions immutable', () => {
      // Month 1 settlement: inflation index 1.0 -> expenses 3,000,000
      const m1 = processMonthlySettlement(state);
      const m1ExpenseTx = m1.transactions.find(
        (t) => t.type === 'MONTHLY_LIVING_EXPENSE' && t.playerId === state.players[0].id
      );
      expect(m1ExpenseTx?.amount).toBe(3_000_000);

      // Month 2 settlement: inflation index 1.005 -> base 3,000,000 * 1.005 = 3,015,000
      const m2 = processMonthlySettlement(m1);
      const m2ExpenseTx = m2.transactions.find(
        (t) => t.type === 'MONTHLY_LIVING_EXPENSE' && t.playerId === state.players[0].id
      );
      expect(m2ExpenseTx?.amount).toBe(3_015_000);

      // Verify Month 1 transaction in m2 history remains completely unchanged
      const m1TxStillInM2 = m2.transactions.find((t) => t.id === m1ExpenseTx?.id);
      expect(m1TxStillInM2?.amount).toBe(3_000_000);
    });
  });

  describe('Economic Events', () => {
    it('produces reproducible, deterministic random event selections with seeded RNG', () => {
      const rng1 = createSeedableRng(42);
      const rng2 = createSeedableRng(42);

      const event1 = selectRandomEconomicEvent(rng1, state);
      const event2 = selectRandomEconomicEvent(rng2, state);

      expect(event1).toBeDefined();
      expect(event2).toBeDefined();
      expect(event1?.id).toBe(event2?.id);
      expect(event1?.title).toBe(event2?.title);
    });

    it('applies food price hike event, increasing food living expenses and expiring after duration', () => {
      const stateWithEvent = triggerEconomicEvent(state, 'evt-sembako-naik');
      expect(stateWithEvent.activeEvents).toHaveLength(1);
      expect(stateWithEvent.activeEvents[0].remainingMonths).toBe(3);

      // Month 1: Food expense increased by 25% (food: 1,000,000 * 1.25 = 1,250,000)
      // Total living expenses: 1,200,000 (housing) + 1,250,000 (food) + 400,000 + 400,000 = 3,250,000
      const m1 = processMonthlySettlement(stateWithEvent);
      const exp1 = m1.transactions.find((t) => t.type === 'MONTHLY_LIVING_EXPENSE');
      expect(exp1?.amount).toBe(3_250_000);
      expect(m1.activeEvents[0].remainingMonths).toBe(2);

      // Settle Month 2 & 3: Remaining months decrements to 1 then 0
      const m2 = processMonthlySettlement(m1);
      expect(m2.activeEvents[0].remainingMonths).toBe(1);

      const m3 = processMonthlySettlement(m2);
      // Event expired and removed from activeEvents!
      expect(m3.activeEvents).toHaveLength(0);
    });
  });

  describe('Employment, PHK & Re-employment', () => {
    it('stops salary payments when PHK event occurs and restores salary upon re-employment', () => {
      const p = state.players[0];
      expect(p.employment?.status).toBe('EMPLOYED');
      expect(p.employment?.monthlySalary).toBe(4_000_000);

      // Trigger PHK
      const phkState = triggerEconomicEvent(state, 'evt-phk', p.id);
      expect(phkState.players[0].employment?.status).toBe('UNEMPLOYED');

      // During monthly settlement, unemployed player receives 0 salary
      const phkSettled = processMonthlySettlement(phkState);
      const salaryTx = phkSettled.transactions.find(
        (t) => t.type === 'MONTHLY_SALARY' && t.playerId === p.id && t.round === phkState.currentRound
      );
      // No monthly salary transaction for unemployed player
      expect(salaryTx).toBeUndefined();

      // Trigger re-employment
      const reEmployed = triggerEconomicEvent(phkSettled, 'evt-diterima-kerja', p.id);
      expect(reEmployed.players[0].employment?.status).toBe('EMPLOYED');

      // Next month settlement awards salary again
      const restoredSettled = processMonthlySettlement(reEmployed);
      const restoredSalaryTx = restoredSettled.transactions.find(
        (t) => t.type === 'MONTHLY_SALARY' && t.playerId === p.id
      );
      expect(restoredSalaryTx).toBeDefined();
      expect(restoredSalaryTx?.amount).toBe(4_000_000);
    });
  });

  describe('Annual Bonus (THR)', () => {
    it('awards THR bonus only at Month 12 and only once per game year to employed salaried players', () => {
      // Advance state to Month 11
      state.currentMonth = 11;
      state.lastSettledMonth = 10;

      // Month 11 settlement: No THR
      const m11 = processMonthlySettlement(state);
      expect(m11.transactions.filter((t) => t.type === 'THR_BONUS')).toHaveLength(0);
      expect(m11.currentMonth).toBe(12);

      // Player 2 is unemployed, Player 1 is employed
      m11.players[1].employment!.status = 'UNEMPLOYED';

      // Month 12 settlement: THR is awarded to Player 1, NOT to unemployed Player 2!
      const m12 = processMonthlySettlement(m11);
      const thrTransactions = m12.transactions.filter((t) => t.type === 'THR_BONUS');

      expect(thrTransactions).toHaveLength(1);
      expect(thrTransactions[0].playerId).toBe(m12.players[0].id);
      expect(thrTransactions[0].amount).toBe(4_000_000); // 1x monthly salary

      // Idempotency: Attempting to repeat month 12 settlement does not duplicate THR
      const repeatedM12 = processMonthlySettlement(m12, { monthOverride: 12 });
      expect(repeatedM12.transactions.filter((t) => t.type === 'THR_BONUS')).toHaveLength(1);
    });
  });
});
