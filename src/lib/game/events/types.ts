import type { EconomicEvent } from '../domain/events';
import type { GameState } from '../domain/game-state';

export interface EventResolution {
  event: EconomicEvent;
  appliedMessage: string;
  apply(state: GameState): GameState;
}
