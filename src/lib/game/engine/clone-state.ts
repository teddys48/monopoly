import type { GameState } from '../domain/game-state';
import { ECONOMIC_CONSTANTS } from '../rules/constants';

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      employment: p.employment ? { ...p.employment } : undefined
    })),
    board: state.board.map((b) => ({ ...b })),
    ownerships: state.ownerships ? state.ownerships.map((o) => ({ ...o })) : [],
    transactions: state.transactions ? state.transactions.map((t) => ({ ...t })) : [],
    loans: state.loans ? state.loans.map((l) => ({ ...l })) : [],
    activeEvents: state.activeEvents ? state.activeEvents.map((e) => ({ ...e })) : [],
    settlements: state.settlements ? state.settlements.map((s) => ({ ...s })) : [],
    indicators: state.indicators
      ? { ...state.indicators }
      : {
          currentMonth: 1,
          inflationIndex: ECONOMIC_CONSTANTS.BASE_INFLATION_INDEX,
          currentInflationRate: ECONOMIC_CONSTANTS.DEFAULT_MONTHLY_INFLATION_RATE,
          condition: 'STABLE'
        },
    livingExpenses: state.livingExpenses
      ? { ...state.livingExpenses }
      : { ...ECONOMIC_CONSTANTS.DEFAULT_LIVING_EXPENSES },
    lastSettlementSummary: state.lastSettlementSummary
      ? { ...state.lastSettlementSummary }
      : null,
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
