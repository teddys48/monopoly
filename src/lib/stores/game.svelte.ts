import type { GameState } from '../game/domain/game-state';
import type { GameMode } from '../game/domain/game-config';
import type { BoardTile } from '../game/domain/board';
import type { GameAction } from '../game/actions/actions';
import { createGameState } from '../game/engine/state-factory';
import { getInitialBoardTiles } from '../game/data/board';
import { createDefaultRng, type Rng } from '../game/engine/rng';
import {
  canRollDice,
  rollDice,
  startMovement,
  finishMovement,
  resolveTurnTile,
  endTurn
} from '../game/engine/game-engine';

export type AppView = 'MENU' | 'SETUP' | 'BOARD';

function isReducedMotion(): boolean {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class GameSessionStore {
  currentView = $state<AppView>('MENU');
  selectedMode = $state<GameMode>('BOT');
  gameState = $state<GameState | null>(null);
  board = $state<BoardTile[]>(getInitialBoardTiles());
  selectedTileIndex = $state<number | null>(0);

  // Presentation & Animation State
  traversingIndex = $state<number | null>(null);
  destinationIndex = $state<number | null>(null);
  animatingPlayerId = $state<string | null>(null);
  isProcessingBot = $state<boolean>(false);

  private rng: Rng = createDefaultRng();
  private animationRunId = 0;
  private botTimeout: ReturnType<typeof setTimeout> | null = null;

  get selectedTile(): BoardTile | null {
    if (this.selectedTileIndex === null || !this.board[this.selectedTileIndex]) {
      return null;
    }
    return this.board[this.selectedTileIndex];
  }

  get activePlayer() {
    if (!this.gameState || this.gameState.players.length === 0) return null;
    return this.gameState.players[this.gameState.activePlayerIndex] ?? null;
  }

  get phase() {
    return this.gameState?.phase ?? 'READY';
  }

  setRng(customRng: Rng): void {
    this.rng = customRng;
  }

  private clearBotTimer(): void {
    if (this.botTimeout) {
      clearTimeout(this.botTimeout);
      this.botTimeout = null;
    }
    this.isProcessingBot = false;
  }

  navigateTo(view: AppView): void {
    this.clearBotTimer();
    this.currentView = view;
  }

  openSetup(mode: GameMode): void {
    this.clearBotTimer();
    this.selectedMode = mode;
    this.currentView = 'SETUP';
  }

  dispatch(action: GameAction): void {
    switch (action.type) {
      case 'START_GAME': {
        this.clearBotTimer();
        this.animationRunId += 1;
        this.traversingIndex = null;
        this.destinationIndex = null;
        this.animatingPlayerId = null;

        this.gameState = createGameState(action.payload, this.board);
        this.selectedTileIndex = 0;
        this.currentView = 'BOARD';

        // Check if first player is bot
        this.checkBotTurn();
        break;
      }

      case 'SELECT_TILE': {
        this.selectedTileIndex = action.payload.tileIndex;
        if (this.gameState) {
          this.gameState.selectedTileIndex = action.payload.tileIndex;
        }
        break;
      }

      case 'CLEAR_SELECTION': {
        this.selectedTileIndex = null;
        if (this.gameState) {
          this.gameState.selectedTileIndex = null;
        }
        break;
      }

      case 'ROLL_DICE': {
        void this.handleRollDice(action.payload?.diceResult);
        break;
      }

      case 'END_TURN':
      case 'NEXT_TURN': {
        this.handleEndTurn();
        break;
      }

      case 'RESET_GAME': {
        this.clearBotTimer();
        this.animationRunId += 1;
        this.traversingIndex = null;
        this.destinationIndex = null;
        this.animatingPlayerId = null;
        this.gameState = null;
        this.currentView = 'MENU';
        this.selectedTileIndex = 0;
        break;
      }
    }
  }

  private async handleRollDice(forcedDice?: [number, number]): Promise<void> {
    if (!this.gameState || !canRollDice(this.gameState)) {
      return;
    }

    this.clearBotTimer();
    const currentRun = ++this.animationRunId;
    const activePlayer = this.gameState.players[this.gameState.activePlayerIndex];

    try {
      // 1. Authoritative Engine Dice Roll
      const { state: rolledState, movement } = rollDice(this.gameState, {
        rng: this.rng,
        dice: forcedDice
      });

      this.gameState = rolledState;
      this.destinationIndex = movement.destinationIndex;
      this.animatingPlayerId = activePlayer.id;
      this.traversingIndex = activePlayer.position;

      // 2. Dice rolling animation pause
      const reducedMotion = isReducedMotion();
      const rollDuration = reducedMotion ? 50 : 600;
      await delay(rollDuration);
      if (currentRun !== this.animationRunId || !this.gameState) return;

      // 3. Start movement phase
      this.gameState = startMovement(this.gameState);

      // 4. Sequential step-by-step movement animation with smooth tactile deceleration
      const totalSteps = movement.traversedIndices.length;
      for (let i = 0; i < totalSteps; i++) {
        const stepIndex = movement.traversedIndices[i];
        const isLastStep = i === totalSteps - 1;

        // Immediately update traversing index so the token hops onto this step
        this.traversingIndex = stepIndex;

        // Smooth cadence: standard step 190ms, final landing step 280ms
        const stepDuration = reducedMotion ? 20 : isLastStep ? 280 : 190;
        await delay(stepDuration);
        if (currentRun !== this.animationRunId || !this.gameState) return;
      }

      // Settled on destination tile
      await delay(reducedMotion ? 10 : 80);
      if (currentRun !== this.animationRunId || !this.gameState) return;

      // 5. Authoritative Finish Movement
      this.gameState = finishMovement(this.gameState);
      this.traversingIndex = null;
      this.animatingPlayerId = null;

      // 6. Tile Resolution
      const { state: resolvedState } = resolveTurnTile(this.gameState);
      this.gameState = resolvedState;
      this.selectedTileIndex = movement.destinationIndex;

      // If active player is Bot AI, automatically schedule ending turn
      if (activePlayer.controller === 'AI') {
        this.isProcessingBot = true;
        this.botTimeout = setTimeout(() => {
          if (currentRun === this.animationRunId && this.gameState?.phase === 'TURN_COMPLETE') {
            this.handleEndTurn(true);
          }
        }, 1200);
      }
    } catch (err) {
      console.error('Error during dice roll / movement execution:', err);
      this.traversingIndex = null;
      this.destinationIndex = null;
      this.animatingPlayerId = null;
    }
  }

  private handleEndTurn(force = false): void {
    if (!this.gameState || this.gameState.phase !== 'TURN_COMPLETE') {
      return;
    }

    const activePlayer = this.gameState.players[this.gameState.activePlayerIndex];
    if (!force && activePlayer?.controller === 'AI') {
      return;
    }

    this.clearBotTimer();
    this.animationRunId += 1;
    this.traversingIndex = null;
    this.destinationIndex = null;
    this.animatingPlayerId = null;

    try {
      this.gameState = endTurn(this.gameState);
      this.checkBotTurn();
    } catch (err) {
      console.error('Error ending turn:', err);
    }
  }

  private checkBotTurn(): void {
    if (!this.gameState || this.gameState.phase !== 'READY') return;

    const activePlayer = this.gameState.players[this.gameState.activePlayerIndex];
    if (activePlayer && activePlayer.controller === 'AI') {
      this.isProcessingBot = true;
      const currentRun = this.animationRunId;
      this.botTimeout = setTimeout(() => {
        if (currentRun === this.animationRunId && canRollDice(this.gameState!)) {
          void this.handleRollDice();
        }
      }, 900);
    }
  }
}

export const gameSession = new GameSessionStore();
