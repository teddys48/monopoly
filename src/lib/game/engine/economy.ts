import type { GameState } from '../domain/game-state';
import type { Player } from '../domain/player';
import type {
  AssetDefinition,
  AssetOwnership,
  Transaction,
  AssetValuationPolicy,
  Loan
} from '../domain/economy';
import { GAME_CONSTANTS } from '../rules/constants';
import { getAssetById } from '../data/assets';
import { formatRupiah } from '../../utils/currency';
import { cloneGameState } from './clone-state';

/**
 * Calculates the resale value of an asset using strict integer arithmetic.
 * Rounding policy: Math.floor((cost * ratePercent) / 100).
 */
export function calculateResalePrice(
  cost: number,
  ratePercent: number = GAME_CONSTANTS.RESALE_RATE_PERCENT
): number {
  if (cost <= 0) return 0;
  return Math.floor((cost * ratePercent) / 100);
}

/**
 * Calculates the total valuation of assets owned by a player.
 */
export function calculatePlayerAssetValuation(
  playerId: string,
  ownerships: AssetOwnership[],
  policy: AssetValuationPolicy = GAME_CONSTANTS.ASSET_VALUATION_POLICY
): number {
  const playerOwnerships = ownerships.filter((o) => o.ownerPlayerId === playerId);
  let total = 0;

  for (const own of playerOwnerships) {
    if (policy === 'RESALE_VALUE') {
      total += calculateResalePrice(own.purchasePrice);
    } else {
      total += own.purchasePrice;
    }
  }

  return total;
}

/**
 * Calculates total outstanding debt from active loans.
 */
export function calculatePlayerTotalDebt(playerId: string, loans: Loan[] = []): number {
  if (!loans || loans.length === 0) return 0;
  return loans
    .filter((l) => l.playerId === playerId && l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.principal, 0);
}

/**
 * Calculates the total net worth of a player:
 * Cash Balance + Asset Valuation - Outstanding Loan Debt - Unpaid Obligations.
 */
export function calculatePlayerNetWorth(
  player: Player,
  ownerships: AssetOwnership[],
  loansOrPolicy?: Loan[] | AssetValuationPolicy,
  policyArg?: AssetValuationPolicy
): number {
  let loans: Loan[] = [];
  let policy: AssetValuationPolicy = GAME_CONSTANTS.ASSET_VALUATION_POLICY;

  if (Array.isArray(loansOrPolicy)) {
    loans = loansOrPolicy;
    if (policyArg) policy = policyArg;
  } else if (typeof loansOrPolicy === 'string') {
    policy = loansOrPolicy;
  }

  const valuation = calculatePlayerAssetValuation(player.id, ownerships, policy);
  const totalDebt = calculatePlayerTotalDebt(player.id, loans);
  const unpaid = player.unpaidObligations ?? 0;
  return player.balance + valuation - totalDebt - unpaid;
}

/**
 * Recalculates net worth for all players in a game state based on authoritative ownerships and loans.
 */
export function syncAllPlayerNetWorth(state: GameState): void {
  for (const player of state.players) {
    player.netWorth = calculatePlayerNetWorth(player, state.ownerships, state.loans ?? []);
  }
}

/**
 * Finds the ownership record for a specific asset definition ID.
 */
export function getAssetOwner(
  ownerships: AssetOwnership[],
  assetId: string
): AssetOwnership | undefined {
  return ownerships.find((o) => o.assetId === assetId);
}

/**
 * Checks whether an asset is available for purchase by the active player.
 */
export function canPurchaseAsset(
  state: GameState,
  assetId: string,
  playerId?: string
): { allowed: boolean; reason?: string; asset?: AssetDefinition; cost?: number } {
  const targetPlayerId = playerId ?? state.players[state.activePlayerIndex]?.id;
  const activePlayer = state.players[state.activePlayerIndex];

  if (!activePlayer || activePlayer.id !== targetPlayerId) {
    return {
      allowed: false,
      reason: 'Bukan giliran Anda. Pembelian aset hanya dapat dilakukan pada giliran pemain aktif.'
    };
  }

  if (activePlayer.isActive === false) {
    return {
      allowed: false,
      reason: 'Pemain tidak aktif dalam permainan.'
    };
  }

  // Phase validation: only allowed when player has finished moving on the tile
  if (state.phase !== 'RESOLVING_TILE' && state.phase !== 'TURN_COMPLETE' && state.phase !== 'ACTION') {
    return {
      allowed: false,
      reason: `Tidak dapat membeli aset pada fase: ${state.phase}. Tunggu hingga pion selesai melangkah.`
    };
  }

  const asset = getAssetById(assetId);
  if (!asset) {
    return {
      allowed: false,
      reason: `Aset dengan ID '${assetId}' tidak terdaftar.`
    };
  }

  // Player must be on the tile containing the asset
  if (activePlayer.position !== asset.tileIndex) {
    return {
      allowed: false,
      reason: `Pemain berada di petak #${activePlayer.position}, sedangkan aset berada di petak #${asset.tileIndex} (${asset.name}).`
    };
  }

  // Check if asset is already owned
  const existingOwner = getAssetOwner(state.ownerships, asset.id);
  if (existingOwner) {
    const owner = state.players.find((p) => p.id === existingOwner.ownerPlayerId);
    return {
      allowed: false,
      reason: `Aset sudah dimiliki oleh ${owner?.name ?? 'pemain lain'}.`
    };
  }

  // Check cash balance
  if (activePlayer.balance < asset.cost) {
    return {
      allowed: false,
      reason: `Saldo kas tidak mencukupi. Butuh ${formatRupiah(asset.cost)}, saldo saat ini ${formatRupiah(activePlayer.balance)}.`,
      asset,
      cost: asset.cost
    };
  }

  return {
    allowed: true,
    asset,
    cost: asset.cost
  };
}

/**
 * Executes a validated purchase of an asset by the active player.
 * Atomic state transition: Deducts cash, records ownership, writes transaction, updates net worth.
 */
export function purchaseAsset(
  currentState: GameState,
  assetId: string,
  playerId?: string
): {
  state: GameState;
  transaction: Transaction;
  ownership: AssetOwnership;
} {
  const check = canPurchaseAsset(currentState, assetId, playerId);
  if (!check.allowed || !check.asset || !check.cost) {
    throw new Error(check.reason ?? 'Pembelian aset tidak diizinkan.');
  }

  const asset = check.asset;
  const cost = check.cost;

  const nextState = cloneGameState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];
  const prevBalance = activePlayer.balance;

  // Deduct purchase price
  activePlayer.balance -= cost;

  // Create new ownership record
  const ownership: AssetOwnership = {
    id: `own-${asset.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    assetId: asset.id,
    ownerPlayerId: activePlayer.id,
    purchasePrice: cost,
    acquiredRound: nextState.currentRound,
    acquiredAt: Date.now()
  };
  nextState.ownerships.push(ownership);

  // Sync net worth
  syncAllPlayerNetWorth(nextState);

  // Record transaction
  const transaction: Transaction = {
    id: `tx-buy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: nextState.currentRound,
    playerId: activePlayer.id,
    type: 'PURCHASE_ASSET',
    assetId: asset.id,
    amount: cost,
    previousBalance: prevBalance,
    resultingBalance: activePlayer.balance,
    description: `${activePlayer.name} membeli aset '${asset.name}' seharga ${formatRupiah(cost)}.`,
    timestamp: Date.now()
  };
  nextState.transactions.unshift(transaction);

  // Clear pending purchase offer on current turn
  if (nextState.currentTurn) {
    nextState.currentTurn.pendingPurchase = null;
  }

  // Log status message
  nextState.statusLog.unshift({
    id: `log-buy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${activePlayer.name} berhasil mengakuisisi '${asset.name}' (- ${formatRupiah(cost)}).`,
    type: 'success'
  });

  return {
    state: nextState,
    transaction,
    ownership
  };
}

/**
 * Declines an optional asset purchase opportunity, clearing pending purchase offer.
 */
export function declinePurchase(currentState: GameState): GameState {
  const nextState = cloneGameState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];

  if (nextState.currentTurn) {
    nextState.currentTurn.pendingPurchase = null;
  }

  nextState.statusLog.unshift({
    id: `log-decline-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${activePlayer.name} memutuskan untuk tidak membeli aset pada petak ini.`,
    type: 'info'
  });

  return nextState;
}

/**
 * Checks whether an asset can be sold by a player.
 */
export function canSellAsset(
  state: GameState,
  assetId: string,
  playerId?: string
): {
  allowed: boolean;
  reason?: string;
  asset?: AssetDefinition;
  ownership?: AssetOwnership;
  resaleValue?: number;
} {
  const targetPlayerId = playerId ?? state.players[state.activePlayerIndex]?.id;
  const targetPlayer = state.players.find((p) => p.id === targetPlayerId);

  if (!targetPlayer) {
    return {
      allowed: false,
      reason: 'Pemain tidak ditemukan.'
    };
  }

  // Cannot sell during active physical rolling or token moving animation
  if (state.phase === 'ROLLING' || state.phase === 'MOVING') {
    return {
      allowed: false,
      reason: 'Tidak dapat menjual aset saat dadu sedang bergulir atau pion sedang melangkah.'
    };
  }

  const asset = getAssetById(assetId);
  if (!asset) {
    return {
      allowed: false,
      reason: `Aset dengan ID '${assetId}' tidak terdaftar dalam katalog.`
    };
  }

  // Find ownership record
  const ownership = state.ownerships.find(
    (o) => o.assetId === assetId && o.ownerPlayerId === targetPlayer.id
  );

  if (!ownership) {
    // Check if owned by someone else
    const otherOwner = state.ownerships.find((o) => o.assetId === assetId);
    if (otherOwner) {
      const ownerName = state.players.find((p) => p.id === otherOwner.ownerPlayerId)?.name ?? 'pemain lain';
      return {
        allowed: false,
        reason: `Aset ini bukan milik Anda. Aset dimiliki oleh ${ownerName}.`
      };
    }
    return {
      allowed: false,
      reason: 'Anda tidak memiliki aset ini dalam portofolio.'
    };
  }

  const resaleValue = calculateResalePrice(asset.cost, asset.resalePolicy.percentage);

  return {
    allowed: true,
    asset,
    ownership,
    resaleValue
  };
}

/**
 * Executes a validated sale of an asset owned by a player.
 * Credits resale value, removes ownership, writes transaction, updates net worth.
 */
export function sellAsset(
  currentState: GameState,
  assetId: string,
  playerId?: string
): {
  state: GameState;
  transaction: Transaction;
  resaleValue: number;
} {
  const check = canSellAsset(currentState, assetId, playerId);
  if (!check.allowed || !check.asset || !check.ownership || check.resaleValue === undefined) {
    throw new Error(check.reason ?? 'Penjualan aset tidak diizinkan.');
  }

  const asset = check.asset;
  const resaleValue = check.resaleValue;
  const targetPlayerId = check.ownership.ownerPlayerId;

  const nextState = cloneGameState(currentState);
  const seller = nextState.players.find((p) => p.id === targetPlayerId);
  if (!seller) {
    throw new Error('Data penjual tidak ditemukan.');
  }

  const prevBalance = seller.balance;

  // Credit resale value to player balance
  seller.balance += resaleValue;

  // Remove ownership record
  const ownershipIndex = nextState.ownerships.findIndex(
    (o) => o.assetId === assetId && o.ownerPlayerId === targetPlayerId
  );
  if (ownershipIndex !== -1) {
    nextState.ownerships.splice(ownershipIndex, 1);
  }

  // Sync net worth
  syncAllPlayerNetWorth(nextState);

  // Record transaction
  const transaction: Transaction = {
    id: `tx-sell-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: nextState.currentRound,
    playerId: seller.id,
    type: 'SELL_ASSET',
    assetId: asset.id,
    amount: resaleValue,
    previousBalance: prevBalance,
    resultingBalance: seller.balance,
    description: `${seller.name} menjual aset '${asset.name}' seharga ${formatRupiah(resaleValue)} (kebijakan likuidasi ${asset.resalePolicy.percentage}%).`,
    timestamp: Date.now()
  };
  nextState.transactions.unshift(transaction);

  // Log status message
  nextState.statusLog.unshift({
    id: `log-sell-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${seller.name} melikuidasi aset '${asset.name}' (+ ${formatRupiah(resaleValue)} kas).`,
    type: 'info'
  });

  return {
    state: nextState,
    transaction,
    resaleValue
  };
}

/**
 * Executes a deterministic rental payment when a visitor lands on an asset owned by an opponent.
 * Non-negative balance guarantee: If visitor has insufficient funds, visitor pays their remaining balance,
 * leaving balance at 0 with an unpaid liability logged.
 */
export function executeRentPayment(
  state: GameState,
  asset: AssetDefinition,
  owner: Player,
  visitor: Player
): {
  amountPaid: number;
  unpaid: number;
  visitorTransaction: Transaction;
  ownerTransaction: Transaction;
} {
  const expectedRent = asset.baseRent;
  const actualPaid = Math.min(visitor.balance, expectedRent);
  const unpaid = expectedRent - actualPaid;

  const visitorPrev = visitor.balance;
  visitor.balance -= actualPaid;

  const ownerPrev = owner.balance;
  owner.balance += actualPaid;

  // Sync net worth
  visitor.netWorth = calculatePlayerNetWorth(visitor, state.ownerships, state.loans ?? []);
  owner.netWorth = calculatePlayerNetWorth(owner, state.ownerships, state.loans ?? []);

  const visitorTransaction: Transaction = {
    id: `tx-rent-exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: state.currentRound,
    playerId: visitor.id,
    type: 'RENT_EXPENSE',
    assetId: asset.id,
    amount: actualPaid,
    previousBalance: visitorPrev,
    resultingBalance: visitor.balance,
    description: unpaid > 0
      ? `${visitor.name} membayar sewa ${formatRupiah(actualPaid)} kepada ${owner.name} di '${asset.name}' (kurang ${formatRupiah(unpaid)} karena kas habis).`
      : `${visitor.name} membayar sewa ${formatRupiah(actualPaid)} kepada ${owner.name} di '${asset.name}'.`,
    timestamp: Date.now()
  };

  const ownerTransaction: Transaction = {
    id: `tx-rent-inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    round: state.currentRound,
    playerId: owner.id,
    type: 'RENT_INCOME',
    assetId: asset.id,
    amount: actualPaid,
    previousBalance: ownerPrev,
    resultingBalance: owner.balance,
    description: `${owner.name} menerima pendapatan sewa ${formatRupiah(actualPaid)} dari ${visitor.name} atas aset '${asset.name}'.`,
    timestamp: Date.now()
  };

  state.transactions.unshift(visitorTransaction);
  state.transactions.unshift(ownerTransaction);

  state.statusLog.unshift({
    id: `log-rent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${visitor.name} singgah di aset ${owner.name} ('${asset.name}') dan membayar sewa ${formatRupiah(actualPaid)}${unpaid > 0 ? ` (kas tidak cukup Rp ${formatRupiah(unpaid)})` : ''}.`,
    type: unpaid > 0 ? 'warning' : 'info'
  });

  return {
    amountPaid: actualPaid,
    unpaid,
    visitorTransaction,
    ownerTransaction
  };
}
