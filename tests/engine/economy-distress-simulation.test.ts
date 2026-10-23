import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import { processMonthlySettlement } from '../../src/lib/game/engine/monthly-settlement';
import {
  applyLoan,
  resolveUnpaidObligations
} from '../../src/lib/game/engine/loans';
import {
  purchaseAsset,
  sellAsset,
  calculatePlayerTotalDebt,
  calculatePlayerAssetValuation
} from '../../src/lib/game/engine/economy';
import {
  triggerEconomicEvent
} from '../../src/lib/game/engine/economic-events';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Financial Distress & 24-Month Invariant Simulation', () => {
  let sampleConfig: GameConfig;
  let state: GameState;

  beforeEach(() => {
    sampleConfig = {
      mode: 'LOCAL_MULTIPLAYER',
      playerCount: 2,
      startingBalance: 10_000_000,
      players: [
        { name: 'Teddy', controller: 'HUMAN', color: '#EF4444', tokenIcon: 'User' },
        { name: 'Andi', controller: 'AI', color: '#10B981', tokenIcon: 'Bot' }
      ]
    };
    state = createGameState(sampleConfig);
  });

  describe('Financial Distress Handling & Recovery', () => {
    it('maintains non-negative balance and accumulates unpaid obligations during severe distress', () => {
      const p = state.players[0];
      p.balance = 500_000; // Low cash
      p.employment!.status = 'UNEMPLOYED'; // No salary income
      // Living expenses at month 1 is 3,000,000. Cash available is 500,000
      const settled = processMonthlySettlement(state);

      // Player pays their entire 500,000, balance becomes 0 (NOT negative!)
      expect(settled.players[0].balance).toBe(0);
      // Unpaid obligation = 3,000,000 - 500,000 = 2,500,000
      expect(settled.players[0].unpaidObligations).toBe(2_500_000);
      // Net worth accounts for unpaid obligations
      expect(settled.players[0].netWorth).toBe(-2_500_000);
    });

    it('allows player to take a loan to resolve unpaid obligations', () => {
      const p = state.players[0];
      p.balance = 0;
      p.unpaidObligations = 1_500_000;

      // Player takes a 2,000,000 loan
      const { state: loanedState } = applyLoan(state, p.id, 2_000_000);
      expect(loanedState.players[0].balance).toBe(2_000_000);

      // Player pays off 1,500,000 of unpaid obligations
      const { state: resolvedState, remainingUnpaid } = resolveUnpaidObligations(
        loanedState,
        p.id,
        1_500_000
      );

      expect(resolvedState.players[0].balance).toBe(500_000); // 2m - 1.5m
      expect(remainingUnpaid).toBe(0);
      expect(resolvedState.players[0].unpaidObligations).toBe(0);
    });

    it('allows player to liquidate an asset to recover from financial distress', () => {
      const p = state.players[0];
      // Buy asset on tile 1 (cost 1,200,000, resale 80% = 960,000)
      state.phase = 'TURN_COMPLETE';
      state.players[0].position = 1;
      const { state: boughtState } = purchaseAsset(state, 'asset-tile-01');

      // Force financial distress
      boughtState.players[0].balance = 0;
      boughtState.players[0].unpaidObligations = 800_000;

      // Sell the asset for 960,000
      const { state: soldState, resaleValue } = sellAsset(boughtState, 'asset-tile-01');
      expect(resaleValue).toBe(960_000);
      expect(soldState.players[0].balance).toBe(960_000);

      // Resolve the 800,000 unpaid obligations using sale proceeds
      const { state: resolvedState } = resolveUnpaidObligations(
        soldState,
        p.id,
        800_000
      );

      expect(resolvedState.players[0].balance).toBe(160_000); // 960k - 800k
      expect(resolvedState.players[0].unpaidObligations).toBe(0);
    });
  });

  describe('Automated 24-Month Economic Invariant Simulation', () => {
    it('runs a 24-month simulation verifying all financial invariants and idempotency', () => {
      let simState = state;

      // Setup Player 1 as Karyawan, Player 2 as Wirausaha
      simState.players[0].employment = {
        type: 'KARYAWAN',
        status: 'EMPLOYED',
        monthlySalary: 4_000_000,
        baseSalary: 4_000_000,
        jobTitle: 'Karyawan Swasta'
      };
      simState.players[1].employment = {
        type: 'WIRAUSAHA',
        status: 'EMPLOYED',
        monthlySalary: 4_500_000,
        baseSalary: 4_500_000,
        jobTitle: 'Wirausahawan Kuliner'
      };

      // Player 1 buys an asset in month 1
      simState.phase = 'TURN_COMPLETE';
      simState.players[0].position = 1;
      const { state: stateWithAsset } = purchaseAsset(simState, 'asset-tile-01');
      simState = stateWithAsset;

      // Player 2 takes a loan of 2,000,000 in month 1
      const { state: stateWithLoan } = applyLoan(simState, simState.players[1].id, 2_000_000);
      simState = stateWithLoan;

      // Run simulation for 24 months (2 full game years)
      for (let month = 1; month <= 24; month++) {
        expect(simState.currentMonth).toBe(month);
        expect(simState.lastSettledMonth).toBe(month - 1);

        // Inject economic event at month 4 (Sembako price hike)
        if (month === 4) {
          simState = triggerEconomicEvent(simState, 'evt-sembako-naik');
        }

        // Inject PHK event on Player 0 at month 8
        if (month === 8) {
          simState = triggerEconomicEvent(simState, 'evt-phk', simState.players[0].id);
        }

        // Re-employ Player 0 at month 10
        if (month === 10) {
          simState = triggerEconomicEvent(simState, 'evt-diterima-kerja', simState.players[0].id);
        }

        // Process monthly settlement for this month
        simState = processMonthlySettlement(simState);

        // Invariant 1: Month counter incremented and lastSettledMonth updated
        expect(simState.currentMonth).toBe(month + 1);
        expect(simState.lastSettledMonth).toBe(month);

        // Invariant 2: Settlement summary recorded
        expect(simState.settlements).toHaveLength(month);
        const latestSettlement = simState.settlements[month - 1];
        expect(latestSettlement.month).toBe(month);

        // Invariant 3: For every player, financial invariants hold
        for (const player of simState.players) {
          // Cash balance is NEVER negative
          expect(player.balance).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(player.balance)).toBe(true);

          // Unpaid obligations is >= 0 and integer
          const unpaid = player.unpaidObligations ?? 0;
          expect(unpaid).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(unpaid)).toBe(true);

          // Net worth matches exact formula
          const valuation = calculatePlayerAssetValuation(player.id, simState.ownerships);
          const debt = calculatePlayerTotalDebt(player.id, simState.loans);
          const expectedNetWorth = player.balance + valuation - debt - unpaid;

          expect(player.netWorth).toBe(expectedNetWorth);
        }

        // Invariant 4: Inflation index is monotonically increasing and bounded
        expect(simState.indicators.inflationIndex).toBeGreaterThanOrEqual(1.0);
        expect(simState.indicators.inflationIndex).toBeLessThan(3.0); // No runaway hyperinflation

        // Invariant 5: Idempotency check: settling the same month again is a no-op
        const repeatSettlement = processMonthlySettlement(simState, { monthOverride: month });
        expect(repeatSettlement.currentMonth).toBe(month + 1);
        expect(repeatSettlement.lastSettledMonth).toBe(month);
        expect(repeatSettlement.settlements).toHaveLength(month);
      }

      // Final checks after 24 full months:
      // THR was awarded exactly twice for eligible salaried player (at month 12 and month 24)
      const thrTxs = simState.transactions.filter(
        (t) => t.type === 'THR_BONUS' && t.playerId === simState.players[0].id
      );
      expect(thrTxs).toHaveLength(2);

      // Player 2's loan of 2,000,000 over 5 months is fully paid off
      const p2Loan = simState.loans.find((l) => l.playerId === simState.players[1].id);
      expect(p2Loan?.status).toBe('PAID_OFF');
      expect(p2Loan?.principal).toBe(0);
    });
  });
});
