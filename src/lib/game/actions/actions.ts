import type { GameConfig } from '../domain/game-config';

export type GameAction =
  | { type: 'START_GAME'; payload: GameConfig }
  | { type: 'ROLL_DICE'; payload?: { diceResult?: [number, number] } }
  | { type: 'START_MOVEMENT' }
  | { type: 'FINISH_MOVEMENT' }
  | { type: 'RESOLVE_TILE' }
  | { type: 'PURCHASE_ASSET'; payload: { assetId: string } }
  | { type: 'DECLINE_PURCHASE' }
  | { type: 'SELL_ASSET'; payload: { assetId: string } }
  | { type: 'END_TURN' }
  | { type: 'SELECT_TILE'; payload: { tileIndex: number } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'NEXT_TURN' } // alias for END_TURN
  | { type: 'APPLY_LOAN'; payload: { amount: number; playerId?: string; termMonths?: number } }
  | { type: 'REPAY_LOAN'; payload: { loanId: string; amount: number; playerId?: string } }
  | { type: 'RESOLVE_OBLIGATIONS'; payload: { amount: number; playerId?: string } }
  | { type: 'TRIGGER_SETTLEMENT' }
  | { type: 'TRIGGER_ECONOMIC_EVENT'; payload: { eventId: string; targetPlayerId?: string } }
  | { type: 'RESET_GAME' };

export const gameActions = {
  startGame(config: GameConfig): GameAction {
    return { type: 'START_GAME', payload: config };
  },
  rollDice(diceResult?: [number, number]): GameAction {
    return { type: 'ROLL_DICE', payload: diceResult ? { diceResult } : undefined };
  },
  startMovement(): GameAction {
    return { type: 'START_MOVEMENT' };
  },
  finishMovement(): GameAction {
    return { type: 'FINISH_MOVEMENT' };
  },
  resolveTile(): GameAction {
    return { type: 'RESOLVE_TILE' };
  },
  purchaseAsset(assetId: string): GameAction {
    return { type: 'PURCHASE_ASSET', payload: { assetId } };
  },
  declinePurchase(): GameAction {
    return { type: 'DECLINE_PURCHASE' };
  },
  sellAsset(assetId: string): GameAction {
    return { type: 'SELL_ASSET', payload: { assetId } };
  },
  endTurn(): GameAction {
    return { type: 'END_TURN' };
  },
  selectTile(tileIndex: number): GameAction {
    return { type: 'SELECT_TILE', payload: { tileIndex } };
  },
  clearSelection(): GameAction {
    return { type: 'CLEAR_SELECTION' };
  },
  nextTurn(): GameAction {
    return { type: 'NEXT_TURN' };
  },
  applyLoan(amount: number, playerId?: string, termMonths?: number): GameAction {
    return { type: 'APPLY_LOAN', payload: { amount, playerId, termMonths } };
  },
  repayLoan(loanId: string, amount: number, playerId?: string): GameAction {
    return { type: 'REPAY_LOAN', payload: { loanId, amount, playerId } };
  },
  resolveObligations(amount: number, playerId?: string): GameAction {
    return { type: 'RESOLVE_OBLIGATIONS', payload: { amount, playerId } };
  },
  triggerSettlement(): GameAction {
    return { type: 'TRIGGER_SETTLEMENT' };
  },
  triggerEconomicEvent(eventId: string, targetPlayerId?: string): GameAction {
    return { type: 'TRIGGER_ECONOMIC_EVENT', payload: { eventId, targetPlayerId } };
  },
  resetGame(): GameAction {
    return { type: 'RESET_GAME' };
  }
};
