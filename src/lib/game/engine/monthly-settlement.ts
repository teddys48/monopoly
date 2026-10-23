import type { GameState } from '../domain/game-state';
import type {
  MonthlySettlement,
  PlayerMonthlySettlement,
  Transaction
} from '../domain/economy';
import { cloneGameState } from './clone-state';
import { ECONOMIC_CONSTANTS } from '../rules/constants';
import { formatRupiah } from '../../utils/currency';
import { calculatePlayerNetWorth, syncAllPlayerNetWorth } from './economy';
import { getActiveExpenseMultiplier, tickActiveEconomicEvents } from './economic-events';

export interface SettlementOptions {
  monthOverride?: number;
  skipIndicatorUpdate?: boolean;
}

/**
 * Calculates current living expenses breakdown for a given state and player.
 */
export function calculateLivingExpensesBreakdown(
  state: GameState
): {
  housing: number;
  food: number;
  transport: number;
  utilities: number;
  total: number;
} {
  const inflation = state.indicators.inflationIndex;
  const foodMult = getActiveExpenseMultiplier(state, 'food');
  const transMult = getActiveExpenseMultiplier(state, 'transport');
  const houseMult = getActiveExpenseMultiplier(state, 'housing');
  const utilMult = getActiveExpenseMultiplier(state, 'utilities');

  const housing = Math.round(state.livingExpenses.housing * inflation * houseMult);
  const food = Math.round(state.livingExpenses.food * inflation * foodMult);
  const transport = Math.round(state.livingExpenses.transport * inflation * transMult);
  const utilities = Math.round(state.livingExpenses.utilities * inflation * utilMult);

  return {
    housing,
    food,
    transport,
    utilities,
    total: housing + food + transport + utilities
  };
}

/**
 * Authoritative orchestrator for monthly economic cycle settlement.
 *
 * Settlement sequence (idempotent for currentMonth):
 * 1. Idempotency and boundary validation
 * 2. Recurring Income (Salary, Freelance, Business)
 * 3. Recurring Living Expenses (Kos, Makan, Transport, Utilitas with inflation & event modifiers)
 * 4. Recurring Asset Expenses / Maintenance
 * 5. Loans & Interest (Interest charge, scheduled principal repayment)
 * 6. Game Taxes (Calculated flat tax on taxable income)
 * 7. Annual Bonus (THR at month 12, 24...) and economic event resolution
 * 8. Economic Indicator Updates (Controlled inflation, event tick)
 * 9. Authoritative Net Worth Sync and Settlement Record construction
 * 10. Increment Month Counter & Status Logging
 */
export function processMonthlySettlement(
  currentState: GameState,
  options: SettlementOptions = {}
): GameState {
  const monthToSettle = options.monthOverride ?? currentState.currentMonth;

  // 1. Idempotency Check: Do not settle the same month twice
  if (currentState.lastSettledMonth >= monthToSettle) {
    return currentState;
  }

  const nextState = cloneGameState(currentState);
  const playerSettlements: PlayerMonthlySettlement[] = [];
  const appliedEvents: string[] = nextState.activeEvents.map((e) => e.title);

  const livingBreakdown = calculateLivingExpensesBreakdown(nextState);

  for (const player of nextState.players) {
    if (player.isActive === false) continue;

    const startBalance = player.balance;
    let salaryIncome = 0;
    let thrBonus = 0;

    // 2. Apply Configured Income
    if (player.employment && player.employment.status === 'EMPLOYED') {
      salaryIncome = player.employment.monthlySalary;
      const prev = player.balance;
      player.balance += salaryIncome;

      const txSalary: Transaction = {
        id: `tx-mo-sal-${Date.now()}-${player.id}-${monthToSettle}`,
        round: nextState.currentRound,
        playerId: player.id,
        type: 'MONTHLY_SALARY',
        amount: salaryIncome,
        previousBalance: prev,
        resultingBalance: player.balance,
        description: `Gaji Bulanan (${player.employment.jobTitle}) Bulan #${monthToSettle}: +${formatRupiah(salaryIncome)}.`,
        timestamp: Date.now()
      };
      nextState.transactions.unshift(txSalary);
    }

    // 3. Apply Recurring Living Expenses
    const livingCost = livingBreakdown.total;
    const livingPayable = Math.min(player.balance, livingCost);
    const livingUnpaid = livingCost - livingPayable;

    const prevLivingBalance = player.balance;
    player.balance -= livingPayable;
    if (livingUnpaid > 0) {
      player.unpaidObligations = (player.unpaidObligations ?? 0) + livingUnpaid;
    }

    const txLiving: Transaction = {
      id: `tx-mo-exp-${Date.now()}-${player.id}-${monthToSettle}`,
      round: nextState.currentRound,
      playerId: player.id,
      type: 'MONTHLY_LIVING_EXPENSE',
      amount: livingPayable,
      previousBalance: prevLivingBalance,
      resultingBalance: player.balance,
      description: livingUnpaid > 0
        ? `Biaya Hidup Bulanan #${monthToSettle}: -${formatRupiah(livingPayable)} (Tunggakan: ${formatRupiah(livingUnpaid)}).`
        : `Biaya Hidup Bulanan #${monthToSettle}: -${formatRupiah(livingPayable)}.`,
      timestamp: Date.now()
    };
    nextState.transactions.unshift(txLiving);

    // 4. Asset Maintenance / Expenses (Default 0 for MVP to avoid duplicate visitor rent)
    const assetMaintenance = 0;

    // 5. Loan Interest and Scheduled Repayments
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    const playerLoans = nextState.loans.filter((l) => l.playerId === player.id && l.status === 'ACTIVE');

    for (const loan of playerLoans) {
      // Interest charge
      const interestAmount = Math.floor((loan.principal * loan.interestRatePercent) / 100);
      const interestPayable = Math.min(player.balance, interestAmount);
      const interestUnpaid = interestAmount - interestPayable;

      const prevIntBalance = player.balance;
      player.balance -= interestPayable;
      if (interestUnpaid > 0) {
        player.unpaidObligations = (player.unpaidObligations ?? 0) + interestUnpaid;
      }
      totalInterestPaid += interestPayable;

      if (interestPayable > 0 || interestUnpaid > 0) {
        nextState.transactions.unshift({
          id: `tx-mo-int-${Date.now()}-${loan.id}-${monthToSettle}`,
          round: nextState.currentRound,
          playerId: player.id,
          type: 'LOAN_INTEREST',
          amount: interestPayable,
          previousBalance: prevIntBalance,
          resultingBalance: player.balance,
          description: interestUnpaid > 0
            ? `Bunga Pinjaman (${loan.interestRatePercent}%) #${monthToSettle}: -${formatRupiah(interestPayable)} (Kurang: ${formatRupiah(interestUnpaid)}).`
            : `Bunga Pinjaman (${loan.interestRatePercent}%) #${monthToSettle}: -${formatRupiah(interestPayable)}.`,
          timestamp: Date.now()
        });
      }

      // Scheduled principal payment
      const scheduledPrincipal = Math.min(loan.principal, Math.ceil(loan.initialPrincipal / loan.termMonths));
      const principalPayable = Math.min(player.balance, scheduledPrincipal);

      if (principalPayable > 0) {
        const prevPrinBalance = player.balance;
        player.balance -= principalPayable;
        loan.principal -= principalPayable;
        totalPrincipalPaid += principalPayable;

        if (loan.principal <= 0) {
          loan.principal = 0;
          loan.status = 'PAID_OFF';
        }

        nextState.transactions.unshift({
          id: `tx-mo-prin-${Date.now()}-${loan.id}-${monthToSettle}`,
          round: nextState.currentRound,
          playerId: player.id,
          type: 'LOAN_REPAYMENT',
          amount: principalPayable,
          previousBalance: prevPrinBalance,
          resultingBalance: player.balance,
          description: `Angsuran Pokok Pinjaman #${monthToSettle}: -${formatRupiah(principalPayable)}${loan.status === 'PAID_OFF' ? ' (Lunas)' : ''}.`,
          timestamp: Date.now()
        });
      }

      loan.remainingMonths = Math.max(0, loan.remainingMonths - 1);
    }

    // 6. Simplified Game Taxes
    const taxableBasis = salaryIncome;
    const taxRatePercent = ECONOMIC_CONSTANTS.DEFAULT_TAX_RATE_PERCENT;
    const taxAssessed = Math.floor((taxableBasis * taxRatePercent) / 100);
    const taxPayable = Math.min(player.balance, taxAssessed);
    const taxUnpaid = taxAssessed - taxPayable;

    const prevTaxBalance = player.balance;
    player.balance -= taxPayable;
    if (taxUnpaid > 0) {
      player.unpaidObligations = (player.unpaidObligations ?? 0) + taxUnpaid;
    }

    if (taxAssessed > 0) {
      nextState.transactions.unshift({
        id: `tx-mo-tax-${Date.now()}-${player.id}-${monthToSettle}`,
        round: nextState.currentRound,
        playerId: player.id,
        type: 'MONTHLY_TAX',
        amount: taxPayable,
        previousBalance: prevTaxBalance,
        resultingBalance: player.balance,
        description: taxUnpaid > 0
          ? `Pajak Penghasilan (${taxRatePercent}%) Bulan #${monthToSettle}: -${formatRupiah(taxPayable)} (Kurang: ${formatRupiah(taxUnpaid)}).`
          : `Pajak Penghasilan (${taxRatePercent}%) Bulan #${monthToSettle}: -${formatRupiah(taxPayable)}.`,
        timestamp: Date.now()
      });
    }

    // 7. Annual Bonus (THR) - Awarded every 12 game months
    if (
      monthToSettle > 0 &&
      monthToSettle % ECONOMIC_CONSTANTS.MONTHS_PER_GAME_YEAR === 0 &&
      player.employment?.type === 'KARYAWAN' &&
      player.employment?.status === 'EMPLOYED'
    ) {
      thrBonus = Math.floor(player.employment.monthlySalary * ECONOMIC_CONSTANTS.THR_BONUS_MULTIPLIER);
      const prevThr = player.balance;
      player.balance += thrBonus;

      nextState.transactions.unshift({
        id: `tx-mo-thr-${Date.now()}-${player.id}-${monthToSettle}`,
        round: nextState.currentRound,
        playerId: player.id,
        type: 'THR_BONUS',
        amount: thrBonus,
        previousBalance: prevThr,
        resultingBalance: player.balance,
        description: `Tunjangan Hari Raya (THR Tahunan ${monthToSettle / 12} Thn): +${formatRupiah(thrBonus)}.`,
        timestamp: Date.now()
      });

      nextState.statusLog.unshift({
        id: `log-thr-${Date.now()}-${player.id}`,
        timestamp: Date.now(),
        message: `${player.name} menerima Tunjangan Hari Raya (THR) sebesar ${formatRupiah(thrBonus)}!`,
        type: 'success'
      });
    }

    const unpaidAddedThisMonth = livingUnpaid + taxUnpaid;
    const endingNetWorth = calculatePlayerNetWorth(player, nextState.ownerships, nextState.loans);
    player.netWorth = endingNetWorth;

    playerSettlements.push({
      playerId: player.id,
      playerName: player.name,
      startingBalance: startBalance,
      income: {
        salary: salaryIncome,
        bonus: thrBonus,
        assetIncome: 0,
        other: 0,
        total: salaryIncome + thrBonus
      },
      expenses: {
        living: livingPayable,
        assetMaintenance,
        total: livingPayable + assetMaintenance
      },
      loanInterestPaid: totalInterestPaid,
      loanPrincipalPaid: totalPrincipalPaid,
      taxAssessed,
      taxPaid: taxPayable,
      unpaidAdded: unpaidAddedThisMonth,
      endingBalance: player.balance,
      endingNetWorth
    });
  }

  // 8. Update Economic Indicators
  if (!options.skipIndicatorUpdate) {
    const rate = nextState.indicators.currentInflationRate;
    const nextIndex = Math.round((nextState.indicators.inflationIndex * (1 + rate)) * 10000) / 10000;
    nextState.indicators.inflationIndex = nextIndex;
  }

  // Tick active economic events
  const stateAfterEvents = tickActiveEconomicEvents(nextState);

  // 9. Record Settlement Summary
  const settlementSummary: MonthlySettlement = {
    id: `settle-m${monthToSettle}-${Date.now()}`,
    month: monthToSettle,
    round: stateAfterEvents.currentRound,
    timestamp: Date.now(),
    playerSettlements,
    indicators: { ...stateAfterEvents.indicators },
    eventsApplied: appliedEvents
  };

  stateAfterEvents.settlements.push(settlementSummary);
  stateAfterEvents.lastSettlementSummary = settlementSummary;
  stateAfterEvents.lastSettledMonth = monthToSettle;

  // 10. Advance game month
  stateAfterEvents.currentMonth = monthToSettle + 1;
  stateAfterEvents.indicators.currentMonth = stateAfterEvents.currentMonth;

  // Authoritative sync
  syncAllPlayerNetWorth(stateAfterEvents);

  stateAfterEvents.statusLog.unshift({
    id: `log-settle-${Date.now()}-${monthToSettle}`,
    timestamp: Date.now(),
    message: `[Siklus Ekonomi] Settlement Bulan #${monthToSettle} selesai diproses. Memasuki Bulan #${stateAfterEvents.currentMonth}.`,
    type: 'info'
  });

  return stateAfterEvents;
}
