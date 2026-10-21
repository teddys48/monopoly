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
  resetGame(): GameAction {
    return { type: 'RESET_GAME' };
  }
};
