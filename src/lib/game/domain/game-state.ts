import type { Player } from './player';
import type { BoardTile } from './board';
import type { GameConfig } from './game-config';
import type { MovementResult } from '../engine/movement';
import type { TileResolutionResult } from '../engine/tile-resolution';
import type { AssetOwnership, Transaction, AssetDefinition } from './economy';

export type GamePhase =
  | 'READY'
  | 'WAITING_ROLL'
  | 'ROLLING'
  | 'MOVING'
  | 'RESOLVING_TILE'
  | 'TURN_COMPLETE'
  | 'GAME_OVER'
  | 'ACTION'
  | 'TURN_ENDED'
  | 'SETUP';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

export interface ActiveTurnInfo {
  playerId: string;
  dice: [number, number];
  movement: MovementResult;
  resolution?: TileResolutionResult;
  pendingPurchase?: AssetDefinition | null;
  rentPaid?: {
    ownerId: string;
    ownerName: string;
    amount: number;
    unpaid: number;
  } | null;
}

export interface GameState {
  id: string;
  createdAt: number;
  config: GameConfig;
  players: Player[];
  activePlayerIndex: number;
  currentRound: number;
  phase: GamePhase;
  board: BoardTile[];
  ownerships: AssetOwnership[];
  transactions: Transaction[];
  lastDiceRoll?: [number, number];
  currentTurn?: ActiveTurnInfo | null;
  selectedTileIndex: number | null;
  statusLog: GameLogEntry[];
}
