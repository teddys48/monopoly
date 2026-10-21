import type { GameState } from '../domain/game-state';
import type { Rng } from './rng';
import type { MovementResult } from './movement';
import type { TileResolutionResult } from './tile-resolution';
import { calculateMovement } from './movement';
import { resolveTile } from './tile-resolution';
import { getNextActivePlayerIndex, isGameOver } from './turn-manager';
import { createDefaultRng } from './rng';
import { GAME_CONSTANTS } from '../rules/constants';
import { formatRupiah } from '../../utils/currency';
import { getAssetByTileId } from '../data/assets';
import { getAssetOwner, executeRentPayment, calculatePlayerNetWorth } from './economy';

export interface RollDiceOptions {
  dice?: [number, number];
  rng?: Rng;
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({ ...p })),
    board: state.board.map((b) => ({ ...b })),
    ownerships: state.ownerships ? state.ownerships.map((o) => ({ ...o })) : [],
    transactions: state.transactions ? state.transactions.map((t) => ({ ...t })) : [],
    statusLog: state.statusLog.map((l) => ({ ...l })),
    currentTurn: state.currentTurn
      ? {
          ...state.currentTurn,
          movement: {
            ...state.currentTurn.movement,
            traversedIndices: [...state.currentTurn.movement.traversedIndices]
          },
          resolution: state.currentTurn.resolution ? { ...state.currentTurn.resolution } : undefined,
          pendingPurchase: state.currentTurn.pendingPurchase
            ? { ...state.currentTurn.pendingPurchase }
            : null,
          rentPaid: state.currentTurn.rentPaid ? { ...state.currentTurn.rentPaid } : null
        }
      : null
  };
}

/**
 * Validates whether the active player can roll the dice.
 */
export function canRollDice(state: GameState): boolean {
  if (state.phase !== 'READY' && state.phase !== 'WAITING_ROLL') {
    return false;
  }
  const activePlayer = state.players[state.activePlayerIndex];
  if (!activePlayer || activePlayer.isActive === false) {
    return false;
  }
  return true;
}

/**
 * Rolls two dice and calculates deterministic movement.
 * Phase transitions: READY / WAITING_ROLL -> ROLLING
 */
export function rollDice(
  currentState: GameState,
  options: RollDiceOptions = {}
): { state: GameState; movement: MovementResult; dice: [number, number] } {
  if (!canRollDice(currentState)) {
    throw new Error(
      `Tidak dapat melempar dadu pada fase: ${currentState.phase}. Selesaikan giliran saat ini terlebih dahulu.`
    );
  }

  const nextState = cloneState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];

  // Determine dice values
  let dice: [number, number];
  if (options.dice) {
    const [d1, d2] = options.dice;
    if (!Number.isInteger(d1) || !Number.isInteger(d2) || d1 < 1 || d1 > 6 || d2 < 1 || d2 > 6) {
      throw new Error(
        `Nilai dadu tidak valid: [${d1}, ${d2}]. Masing-masing dadu harus bernilai 1-6.`
      );
    }
    dice = [d1, d2];
  } else {
    const rng = options.rng ?? createDefaultRng();
    dice = rng.rollDice(2, 6);
  }

  const totalSteps = dice[0] + dice[1];
  const movement = calculateMovement(activePlayer.position, totalSteps, nextState.board.length);

  nextState.phase = 'ROLLING';
  nextState.lastDiceRoll = dice;
  nextState.currentTurn = {
    playerId: activePlayer.id,
    dice,
    movement,
    pendingPurchase: null,
    rentPaid: null
  };

  nextState.statusLog.unshift({
    id: `log-roll-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${activePlayer.name} melempar dadu: ${dice[0]} + ${dice[1]} = ${totalSteps}.`,
    type: 'info'
  });

  return {
    state: nextState,
    movement,
    dice
  };
}

/**
 * Starts the token movement animation.
 * Phase transitions: ROLLING -> MOVING
 */
export function startMovement(currentState: GameState): GameState {
  if (currentState.phase !== 'ROLLING') {
    throw new Error(
      `Tidak dapat memulai pergerakan pada fase: ${currentState.phase}. Harus berada dalam fase ROLLING.`
    );
  }

  if (!currentState.currentTurn) {
    throw new Error('Data giliran saat ini (currentTurn) tidak ditemukan.');
  }

  const nextState = cloneState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];
  const movement = nextState.currentTurn!.movement;
  const destinationTile = nextState.board[movement.destinationIndex];

  nextState.phase = 'MOVING';

  nextState.statusLog.unshift({
    id: `log-move-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${activePlayer.name} bergerak ${movement.steps} langkah menuju "${destinationTile?.shortName ?? destinationTile?.name}".`,
    type: 'info'
  });

  return nextState;
}

/**
 * Completes token movement, applying lap salary reward if START tile was crossed.
 * Phase transitions: MOVING -> RESOLVING_TILE
 */
export function finishMovement(currentState: GameState): GameState {
  if (currentState.phase !== 'MOVING') {
    throw new Error(
      `Tidak dapat menyelesaikan pergerakan pada fase: ${currentState.phase}. Harus berada dalam fase MOVING.`
    );
  }

  if (!currentState.currentTurn) {
    throw new Error('Data giliran saat ini (currentTurn) tidak ditemukan.');
  }

  const nextState = cloneState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];
  const movement = nextState.currentTurn!.movement;

  // Authoritative position updates now that movement is finished
  activePlayer.position = movement.destinationIndex;
  nextState.selectedTileIndex = movement.destinationIndex;

  // Apply configurable lap salary if passed start
  if (movement.crossedStart && GAME_CONSTANTS.SALARY_PER_LAP > 0) {
    const prevBalance = activePlayer.balance;
    activePlayer.balance += GAME_CONSTANTS.SALARY_PER_LAP;
    activePlayer.netWorth = calculatePlayerNetWorth(activePlayer, nextState.ownerships);

    nextState.transactions.unshift({
      id: `tx-salary-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      round: nextState.currentRound,
      playerId: activePlayer.id,
      type: 'SALARY',
      amount: GAME_CONSTANTS.SALARY_PER_LAP,
      previousBalance: prevBalance,
      resultingBalance: activePlayer.balance,
      description: `${activePlayer.name} menerima Gaji Pokok putaran sebesar ${formatRupiah(GAME_CONSTANTS.SALARY_PER_LAP)}.`,
      timestamp: Date.now()
    });

    nextState.statusLog.unshift({
      id: `log-salary-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      message: `${activePlayer.name} melewati titik Mulai (+ ${formatRupiah(GAME_CONSTANTS.SALARY_PER_LAP)} Gaji Pokok).`,
      type: 'success'
    });
  }

  nextState.phase = 'RESOLVING_TILE';
  return nextState;
}

/**
 * Resolves the destination tile where the player landed.
 * Handles economic impacts (rent, unowned asset purchase opportunity, tax).
 * Phase transitions: RESOLVING_TILE -> TURN_COMPLETE
 */
export function resolveTurnTile(currentState: GameState): {
  state: GameState;
  resolution: TileResolutionResult;
} {
  if (currentState.phase !== 'RESOLVING_TILE') {
    throw new Error(
      `Tidak dapat menyelesaikan petak pada fase: ${currentState.phase}. Harus berada dalam fase RESOLVING_TILE.`
    );
  }

  if (!currentState.currentTurn) {
    throw new Error('Data giliran saat ini (currentTurn) tidak ditemukan.');
  }

  const nextState = cloneState(currentState);
  const activePlayer = nextState.players[nextState.activePlayerIndex];
  const destinationTile = nextState.board[activePlayer.position];

  const resolution = resolveTile(destinationTile, activePlayer, {
    crossedStart: nextState.currentTurn!.movement.crossedStart,
    salaryPerLap: GAME_CONSTANTS.SALARY_PER_LAP,
    ownerships: nextState.ownerships,
    players: nextState.players
  });

  // Handle asset mechanics
  const asset = destinationTile ? getAssetByTileId(destinationTile.id) : undefined;
  if (asset) {
    const existingOwnership = getAssetOwner(nextState.ownerships, asset.id);
    if (existingOwnership) {
      if (existingOwnership.ownerPlayerId !== activePlayer.id) {
        // Opponent owns the asset: Execute rent payment
        const owner = nextState.players.find((p) => p.id === existingOwnership.ownerPlayerId);
        if (owner) {
          const rentResult = executeRentPayment(nextState, asset, owner, activePlayer);
          nextState.currentTurn!.rentPaid = {
            ownerId: owner.id,
            ownerName: owner.name,
            amount: rentResult.amountPaid,
            unpaid: rentResult.unpaid
          };
        }
      }
    } else {
      // Asset is unowned: Available for purchase
      nextState.currentTurn!.pendingPurchase = asset;
    }
  } else if (resolution.financialImpact.amount < 0) {
    // Non-asset expense (e.g. TAX tile)
    const expense = Math.abs(resolution.financialImpact.amount);
    const prevBalance = activePlayer.balance;
    const actualDeduction = Math.min(activePlayer.balance, expense);
    activePlayer.balance -= actualDeduction;
    activePlayer.netWorth = calculatePlayerNetWorth(activePlayer, nextState.ownerships);

    nextState.transactions.unshift({
      id: `tx-tax-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      round: nextState.currentRound,
      playerId: activePlayer.id,
      type: 'TAX_EXPENSE',
      amount: actualDeduction,
      previousBalance: prevBalance,
      resultingBalance: activePlayer.balance,
      description: `${activePlayer.name} membayar ${resolution.financialImpact.reason}: -${formatRupiah(actualDeduction)}.`,
      timestamp: Date.now()
    });

    nextState.statusLog.unshift({
      id: `log-tax-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      message: `${activePlayer.name} membayar ${resolution.financialImpact.reason}: -${formatRupiah(actualDeduction)}.`,
      type: 'warning'
    });
  }

  nextState.currentTurn!.resolution = resolution;
  nextState.phase = 'TURN_COMPLETE';

  nextState.statusLog.unshift({
    id: `log-land-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `${activePlayer.name} tiba di "${destinationTile?.name ?? 'Petak'}". ${resolution.headline}.`,
    type: 'info'
  });

  return {
    state: nextState,
    resolution
  };
}

/**
 * Checks whether the current turn's dice total grants the player a bonus roll.
 */
export function hasBonusRoll(state: GameState): boolean {
  const dice = state.currentTurn?.dice;
  if (!dice) {
    return false;
  }
  return dice[0] + dice[1] === GAME_CONSTANTS.BONUS_ROLL_TOTAL;
}

/**
 * Ends the active player's turn and switches to the next eligible player.
 * If the dice total equals BONUS_ROLL_TOTAL, the same player keeps the turn.
 * Phase transitions: TURN_COMPLETE -> READY / GAME_OVER
 */
export function endTurn(currentState: GameState): GameState {
  if (currentState.phase !== 'TURN_COMPLETE') {
    throw new Error(
      `Tidak dapat mengakhiri giliran pada fase: ${currentState.phase}. Selesaikan seluruh tahapan giliran terlebih dahulu.`
    );
  }

  const nextState = cloneState(currentState);

  // Check if game is over
  if (isGameOver(nextState.players)) {
    nextState.phase = 'GAME_OVER';
    nextState.statusLog.unshift({
      id: `log-gameover-${Date.now()}`,
      timestamp: Date.now(),
      message: 'Permainan telah berakhir.',
      type: 'warning'
    });
    return nextState;
  }

  if (hasBonusRoll(nextState)) {
    const activePlayer = nextState.players[nextState.activePlayerIndex];
    nextState.currentTurn = null;
    nextState.phase = 'READY';

    nextState.statusLog.unshift({
      id: `log-bonus-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      message: `${activePlayer.name} mendapat total dadu ${GAME_CONSTANTS.BONUS_ROLL_TOTAL} dan berhak melempar dadu lagi!`,
      type: 'success'
    });

    return nextState;
  }

  const { nextIndex, wrappedAround } = getNextActivePlayerIndex(
    nextState.players,
    nextState.activePlayerIndex
  );

  nextState.activePlayerIndex = nextIndex;
  if (wrappedAround) {
    nextState.currentRound += 1;
    nextState.statusLog.unshift({
      id: `log-round-${Date.now()}-${nextState.currentRound}`,
      timestamp: Date.now(),
      message: `Putaran #${nextState.currentRound} dimulai!`,
      type: 'info'
    });
  }

  const nextPlayer = nextState.players[nextIndex];
  nextState.currentTurn = null;
  nextState.phase = 'READY';

  nextState.statusLog.unshift({
    id: `log-next-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: Date.now(),
    message: `Giliran berikutnya: ${nextPlayer.name}.`,
    type: 'info'
  });

  return nextState;
}

/**
 * Headless turn execution helper, ideal for automated unit tests and bot turns.
 */
export function executeFullTurn(currentState: GameState, options: RollDiceOptions = {}): GameState {
  const { state: rolledState } = rollDice(currentState, options);
  const movedState = startMovement(rolledState);
  const finishedState = finishMovement(movedState);
  const { state: resolvedState } = resolveTurnTile(finishedState);
  return endTurn(resolvedState);
}
