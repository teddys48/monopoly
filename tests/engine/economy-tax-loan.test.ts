import { describe, it, expect, beforeEach } from 'vitest';
import { createGameState } from '../../src/lib/game/engine/state-factory';
import { canApplyLoan, applyLoan, canRepayLoan, repayLoan } from '../../src/lib/game/engine/loans';
import { processMonthlySettlement } from '../../src/lib/game/engine/monthly-settlement';
import { calculatePlayerTotalDebt, calculatePlayerNetWorth } from '../../src/lib/game/engine/economy';
import type { GameState } from '../../src/lib/game/domain/game-state';
import type { GameConfig } from '../../src/lib/game/domain/game-config';

describe('Economic Engine — Game Taxes, Loans & Debt Management', () => {
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

  describe('Simplified Game Taxes', () => {
    it('calculates tax based on monthly taxable income with integer rounding', () => {
      // Modify salary to produce fractional tax before floor (e.g., 4,333,333 * 5% = 216,666.65 -> 216,666)
      state.players[0].employment!.monthlySalary = 4_333_333;
      const initialCash = state.players[0].balance;

      const settled = processMonthlySettlement(state);

      const taxTx = settled.transactions.find(
        (t) => t.type === 'MONTHLY_TAX' && t.playerId === state.players[0].id
      );

      expect(taxTx).toBeDefined();
      expect(taxTx?.amount).toBe(216_666);
      expect(Number.isInteger(taxTx?.amount)).toBe(true);

      // Verify Player 1 balance matches integer calculation
      expect(settled.players[0].balance).toBe(
        initialCash + 4_333_333 - 3_000_000 - 216_666
      );
    });

    it('handles tax when cash is insufficient without creating negative balance', () => {
      const p = state.players[0];
      // Player is unemployed, earns 0 salary, and has only 100,000 cash
      p.employment!.status = 'UNEMPLOYED';
      p.balance = 100_000;
      // Set living expenses to 0 so we only test tax
      state.livingExpenses = { housing: 0, food: 0, transport: 0, utilities: 0 };
      // Simulate taxable event or direct tax
      p.employment!.monthlySalary = 4_000_000;
      p.employment!.status = 'EMPLOYED';
      // Total tax assessed = 200,000. But imagine player cash before tax was only 50,000
      // We can test this by running settlement where living expenses consume cash first
      state.livingExpenses = { housing: 4_000_000, food: 0, transport: 0, utilities: 0 };
      p.balance = 0; // Starts with 0. Receives 4,000,000 salary. Pays 4,000,000 housing. Cash becomes 0!
      // Tax assessed is 200,000, but cash is 0!

      const settled = processMonthlySettlement(state);

      expect(settled.players[0].balance).toBe(0); // NOT negative!
      expect(settled.players[0].unpaidObligations).toBe(200_000); // Recorded as unpaid obligation!
    });
  });

  describe('Loan System & Debt Service', () => {
    it('disburses loan, increases cash, creates liability, and preserves net worth', () => {
      const p = state.players[0];
      const initialBalance = p.balance;
      const initialNetWorth = calculatePlayerNetWorth(p, state.ownerships, state.loans);

      const { state: loanedState, loan, transaction } = applyLoan(state, p.id, 2_000_000);

      // 1. Cash increases by principal
      const loanedPlayer = loanedState.players[0];
      expect(loanedPlayer.balance).toBe(initialBalance + 2_000_000);

      // 2. Liability recorded
      expect(loanedState.loans).toHaveLength(1);
      expect(loan.principal).toBe(2_000_000);
      expect(loan.initialPrincipal).toBe(2_000_000);
      expect(loan.status).toBe('ACTIVE');
      expect(calculatePlayerTotalDebt(p.id, loanedState.loans)).toBe(2_000_000);

      // 3. Net worth is preserved (Cash +2m, Debt +2m => net change 0)
      expect(loanedPlayer.netWorth).toBe(initialNetWorth);

      // 4. Transaction is recorded as LOAN_DISBURSEMENT (not earned income)
      expect(transaction.type).toBe('LOAN_DISBURSEMENT');
      expect(transaction.amount).toBe(2_000_000);
    });

    it('enforces maximum loan limit and rejects exceeding requests', () => {
      const p = state.players[0];

      // Check max borrowable (starts at 5,000,000)
      const check1 = canApplyLoan(state, p.id, 6_000_000);
      expect(check1.allowed).toBe(false);
      expect(check1.reason).toMatch(/Melebihi batas plafon pinjaman/);

      // Borrow 3,000,000 successfully
      const { state: stateAfter3m } = applyLoan(state, p.id, 3_000_000);

      // Plafon remaining is now 2,000,000
      const check2 = canApplyLoan(stateAfter3m, p.id, 2_500_000);
      expect(check2.allowed).toBe(false);

      const check3 = canApplyLoan(stateAfter3m, p.id, 2_000_000);
      expect(check3.allowed).toBe(true);
    });

    it('rejects non-positive or non-integer loan applications', () => {
      expect(canApplyLoan(state, state.players[0].id, 0).allowed).toBe(false);
      expect(canApplyLoan(state, state.players[0].id, -500_000).allowed).toBe(false);
      expect(canApplyLoan(state, state.players[0].id, 100_000.5).allowed).toBe(false);
    });

    it('charges monthly loan interest and deducts scheduled principal during settlement', () => {
      const p = state.players[0];
      // Apply 2,000,000 loan (3% interest = 60,000 / month; scheduled principal over 5 months = 400,000 / month)
      const { state: loanedState, loan } = applyLoan(state, p.id, 2_000_000, 5);

      const cashBeforeSettlement = loanedState.players[0].balance;

      const settled = processMonthlySettlement(loanedState);

      const settledLoan = settled.loans.find((l) => l.id === loan.id)!;
      // Principal reduced by 400,000 (from 2,000,000 down to 1,600,000)
      expect(settledLoan.principal).toBe(1_600_000);
      expect(settledLoan.remainingMonths).toBe(4);

      // Verify interest and repayment transactions
      const intTx = settled.transactions.find((t) => t.type === 'LOAN_INTEREST');
      const prinTx = settled.transactions.find((t) => t.type === 'LOAN_REPAYMENT');

      expect(intTx?.amount).toBe(60_000); // 3% of 2,000,000
      expect(prinTx?.amount).toBe(400_000); // 2,000,000 / 5

      // Net change for player 0:
      // +4,000,000 (salary) - 3,000,000 (living) - 200,000 (tax) - 60,000 (interest) - 400,000 (principal)
      // = +340,000
      expect(settled.players[0].balance).toBe(cashBeforeSettlement + 340_000);
    });

    it('allows voluntary early loan repayment and marks loan as PAID_OFF when balance reaches 0', () => {
      const p = state.players[0];
      const { state: loanedState, loan } = applyLoan(state, p.id, 1_000_000);

      // Partial repayment of 400,000
      const { state: partRepaid, loan: partLoan } = repayLoan(loanedState, loan.id, 400_000);
      expect(partLoan.principal).toBe(600_000);
      expect(partLoan.status).toBe('ACTIVE');

      // Attempting to repay more than remaining principal (e.g. 700,000) is rejected
      expect(canRepayLoan(partRepaid, loan.id, 700_000).allowed).toBe(false);

      // Full final repayment of remaining 600,000
      const { state: fullyRepaid, loan: paidLoan } = repayLoan(partRepaid, loan.id, 600_000);
      expect(paidLoan.principal).toBe(0);
      expect(paidLoan.status).toBe('PAID_OFF');
      expect(calculatePlayerTotalDebt(p.id, fullyRepaid.loans)).toBe(0);
    });
  });
});
