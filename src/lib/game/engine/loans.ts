import type { GameState } from '../domain/game-state';
import type { Loan, Transaction } from '../domain/economy';
import { cloneGameState } from './clone-state';
import { ECONOMIC_CONSTANTS } from '../rules/constants';
import { formatRupiah } from '../../utils/currency';
import { calculatePlayerNetWorth, calculatePlayerTotalDebt } from './economy';

export interface LoanApplicationCheck {
  allowed: boolean;
  reason?: string;
  maxBorrowable: number;
  interestRatePercent: number;
  termMonths: number;
  estimatedMonthlyPayment?: number;
}

/**
 * Checks whether a player can apply for a new loan.
 */
export function canApplyLoan(
  state: GameState,
  playerId: string,
  requestedAmount: number
): LoanApplicationCheck {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    return {
      allowed: false,
      reason: 'Data pemain tidak ditemukan.',
      maxBorrowable: 0,
      interestRatePercent: ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT,
      termMonths: ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
    };
  }

  if (player.isActive === false) {
    return {
      allowed: false,
      reason: 'Pemain tidak aktif dalam permainan.',
      maxBorrowable: 0,
      interestRatePercent: ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT,
      termMonths: ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
    };
  }

  const currentDebt = calculatePlayerTotalDebt(playerId, state.loans);
  const maxBorrowable = Math.max(0, ECONOMIC_CONSTANTS.MAX_LOAN_AMOUNT - currentDebt);

  if (requestedAmount <= 0) {
    return {
      allowed: false,
      reason: 'Jumlah pinjaman harus bernilai positif lebih dari Rp 0.',
      maxBorrowable,
      interestRatePercent: ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT,
      termMonths: ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
    };
  }

  if (!Number.isInteger(requestedAmount)) {
    return {
      allowed: false,
      reason: 'Jumlah pinjaman harus berupa bilangan bulat Rupiah.',
      maxBorrowable,
      interestRatePercent: ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT,
      termMonths: ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
    };
  }

  if (requestedAmount > maxBorrowable) {
    return {
      allowed: false,
      reason: `Melebihi batas plafon pinjaman. Sisa plafon tersedia: ${formatRupiah(maxBorrowable)}, diajukan: ${formatRupiah(requestedAmount)}.`,
      maxBorrowable,
      interestRatePercent: ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT,
      termMonths: ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
    };
  }

  const interestRate = ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT;
  const termMonths: number = ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS;
  const monthlyPrincipal = Math.ceil(requestedAmount / termMonths);
  const monthlyInterest = Math.floor((requestedAmount * interestRate) / 100);

  return {
    allowed: true,
    maxBorrowable,
    interestRatePercent: interestRate,
    termMonths,
    estimatedMonthlyPayment: monthlyPrincipal + monthlyInterest
  };
}

/**
 * Disburses a validated loan to the player.
 * Increases cash balance, creates Loan entity, records LOAN_DISBURSEMENT transaction.
 */
export function applyLoan(
  currentState: GameState,
  playerId: string,
  amount: number,
  termMonths: number = ECONOMIC_CONSTANTS.DEFAULT_LOAN_TERM_MONTHS
): {
  state: GameState;
  loan: Loan;
  transaction: Transaction;
} {
  const check = canApplyLoan(currentState, playerId, amount);
  if (!check.allowed) {
    throw new Error(check.reason ?? 'Pengajuan pinjaman tidak disetujui.');
  }

  const nextState = cloneGameState(currentState);
  const player = nextState.players.find((p) => p.id === playerId);
  if (!player) throw new Error('Data peminjam tidak ditemukan.');

  const interestRate = ECONOMIC_CONSTANTS.DEFAULT_LOAN_INTEREST_RATE_PERCENT;
  const monthlyPrincipal = Math.ceil(amount / termMonths);
  const monthlyInterest = Math.floor((amount * interestRate) / 100);

  const loan: Loan = {
    id: `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    playerId,
    principal: amount,
    initialPrincipal: amount,
    interestRatePercent: interestRate,
    termMonths,
    remainingMonths: termMonths,
    monthlyPayment: monthlyPrincipal + monthlyInterest,
    status: 'ACTIVE',
    createdAtMonth: nextState.currentMonth
  };

  nextState.loans.push(loan);

  const prevBalance = player.balance;
  player.balance += amount;
  player.netWorth = calculatePlayerNetWorth(player, nextState.ownerships, nextState.loans);

  const transaction: Transaction = {
    id: `tx-loan-disb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: nextState.currentRound,
    playerId,
    type: 'LOAN_DISBURSEMENT',
    amount,
    previousBalance: prevBalance,
    resultingBalance: player.balance,
    description: `${player.name} mencairkan pinjaman permodalan sebesar ${formatRupiah(amount)} (bunga ${interestRate}%/bln, tenor ${termMonths} bln).`,
    timestamp: Date.now()
  };
  nextState.transactions.unshift(transaction);

  nextState.statusLog.unshift({
    id: `log-loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${player.name} mendapatkan pencairan kredit bank sebesar ${formatRupiah(amount)}.`,
    type: 'success'
  });

  return {
    state: nextState,
    loan,
    transaction
  };
}

/**
 * Checks whether a player can repay an outstanding loan.
 */
export function canRepayLoan(
  state: GameState,
  loanId: string,
  amount: number,
  playerId?: string
): { allowed: boolean; reason?: string; loan?: Loan } {
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) {
    return { allowed: false, reason: 'Data pinjaman tidak ditemukan.' };
  }

  if (loan.status !== 'ACTIVE') {
    return { allowed: false, reason: 'Pinjaman sudah lunas sebelumnya.' };
  }

  const targetPlayerId = playerId ?? loan.playerId;
  if (loan.playerId !== targetPlayerId) {
    return { allowed: false, reason: 'Pinjaman ini bukan milik pemain tersebut.' };
  }

  const player = state.players.find((p) => p.id === targetPlayerId);
  if (!player) {
    return { allowed: false, reason: 'Data pemain tidak ditemukan.' };
  }

  if (amount <= 0 || !Number.isInteger(amount)) {
    return { allowed: false, reason: 'Nominal pelunasan harus berupa bilangan bulat positif.' };
  }

  if (amount > loan.principal) {
    return {
      allowed: false,
      reason: `Nominal pelunasan (${formatRupiah(amount)}) melebihi sisa pokok hutang (${formatRupiah(loan.principal)}).`
    };
  }

  if (player.balance < amount) {
    return {
      allowed: false,
      reason: `Saldo kas tidak mencukupi. Butuh ${formatRupiah(amount)}, saldo saat ini ${formatRupiah(player.balance)}.`
    };
  }

  return { allowed: true, loan };
}

/**
 * Executes a voluntary or early repayment on an active loan.
 */
export function repayLoan(
  currentState: GameState,
  loanId: string,
  amount: number,
  playerId?: string
): {
  state: GameState;
  loan: Loan;
  transaction: Transaction;
} {
  const check = canRepayLoan(currentState, loanId, amount, playerId);
  if (!check.allowed || !check.loan) {
    throw new Error(check.reason ?? 'Pelunasan pinjaman tidak dapat diproses.');
  }

  const nextState = cloneGameState(currentState);
  const loan = nextState.loans.find((l) => l.id === loanId);
  if (!loan) throw new Error('Data pinjaman tidak ditemukan pada salinan state.');

  const targetPlayerId = playerId ?? loan.playerId;
  const player = nextState.players.find((p) => p.id === targetPlayerId);
  if (!player) throw new Error('Data pemain tidak ditemukan.');

  const prevBalance = player.balance;
  player.balance -= amount;
  loan.principal -= amount;

  if (loan.principal <= 0) {
    loan.principal = 0;
    loan.status = 'PAID_OFF';
  }

  player.netWorth = calculatePlayerNetWorth(player, nextState.ownerships, nextState.loans);

  const transaction: Transaction = {
    id: `tx-loan-repay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: nextState.currentRound,
    playerId: player.id,
    type: 'LOAN_REPAYMENT',
    amount,
    previousBalance: prevBalance,
    resultingBalance: player.balance,
    description: `${player.name} melunasi pokok hutang pinjaman sebesar ${formatRupiah(amount)}${loan.status === 'PAID_OFF' ? ' (LUNAS)' : ''}.`,
    timestamp: Date.now()
  };
  nextState.transactions.unshift(transaction);

  nextState.statusLog.unshift({
    id: `log-repay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${player.name} membayar angsuran pokok pinjaman ${formatRupiah(amount)}${loan.status === 'PAID_OFF' ? ' (Pinjaman resmi Lunas!)' : ''}.`,
    type: 'info'
  });

  return {
    state: nextState,
    loan,
    transaction
  };
}

/**
 * Resolves accumulated unpaid obligations with available player cash.
 */
export function resolveUnpaidObligations(
  currentState: GameState,
  playerId: string,
  amount: number
): {
  state: GameState;
  transaction: Transaction;
  remainingUnpaid: number;
} {
  const nextState = cloneGameState(currentState);
  const player = nextState.players.find((p) => p.id === playerId);
  if (!player) throw new Error('Data pemain tidak ditemukan.');

  const currentUnpaid = player.unpaidObligations ?? 0;
  if (currentUnpaid <= 0) {
    throw new Error('Pemain tidak memiliki tunggakan kewajiban yang belum dibayar.');
  }

  if (amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('Nominal pelunasan kewajiban harus berupa bilangan bulat positif.');
  }

  if (amount > currentUnpaid) {
    throw new Error(`Nominal pelunasan (${formatRupiah(amount)}) melebihi total tunggakan (${formatRupiah(currentUnpaid)}).`);
  }

  if (player.balance < amount) {
    throw new Error(`Saldo kas tidak mencukupi untuk melunasi tunggakan. Butuh ${formatRupiah(amount)}, saldo: ${formatRupiah(player.balance)}.`);
  }

  const prevBalance = player.balance;
  player.balance -= amount;
  player.unpaidObligations = currentUnpaid - amount;
  player.netWorth = calculatePlayerNetWorth(player, nextState.ownerships, nextState.loans);

  const transaction: Transaction = {
    id: `tx-unpaid-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: nextState.currentRound,
    playerId: player.id,
    type: 'UNPAID_OBLIGATION_SETTLED',
    amount,
    previousBalance: prevBalance,
    resultingBalance: player.balance,
    description: `${player.name} melunasi tunggakan kewajiban sebesar ${formatRupiah(amount)}.`,
    timestamp: Date.now()
  };
  nextState.transactions.unshift(transaction);

  nextState.statusLog.unshift({
    id: `log-unpaid-res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${player.name} berhasil melunasi tunggakan kewajiban sebesar ${formatRupiah(amount)}.`,
    type: 'success'
  });

  return {
    state: nextState,
    transaction,
    remainingUnpaid: player.unpaidObligations
  };
}
