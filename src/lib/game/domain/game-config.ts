import type { PlayerController } from './player';

export type GameMode = 'BOT' | 'LOCAL_MULTIPLAYER' | 'ONLINE_MULTIPLAYER';

export interface PlayerDraft {
  name: string;
  controller: PlayerController;
  color: string;
  tokenIcon: string;
}

export interface GameConfig {
  mode: GameMode;
  playerCount: number;
  startingBalance: number;
  players: PlayerDraft[];
  seed?: number;
}
