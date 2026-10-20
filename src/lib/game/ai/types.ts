import type { GameState } from '../domain/game-state';
import type { GameAction } from '../actions/actions';

export interface AiDecisionContext {
  gameState: Readonly<GameState>;
  playerId: string;
}

export interface AiAgentStrategy {
  name: string;
  decideAction(context: AiDecisionContext): GameAction | null;
}
