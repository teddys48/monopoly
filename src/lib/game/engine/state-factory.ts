import type { GameConfig } from '../domain/game-config';
import type { GameState } from '../domain/game-state';
import type { Player } from '../domain/player';
import type { BoardTile } from '../domain/board';
import { validateGameConfig, validateBoardIntegrity } from '../rules/validation';
import { getInitialBoardTiles } from '../data/board';

/**
 * Creates the initial game state from a validated game configuration.
 * Throws an Error if configuration or board fails validation.
 */
export function createGameState(config: GameConfig, customBoard?: BoardTile[]): GameState {
  const configValidation = validateGameConfig(config);
  if (!configValidation.isValid) {
    throw new Error(`Konfigurasi permainan tidak valid: ${configValidation.errors.join('; ')}`);
  }

  const boardToUse = customBoard ?? getInitialBoardTiles();
  const boardValidation = validateBoardIntegrity(boardToUse);
  if (!boardValidation.isValid) {
    throw new Error(`Integritas papan tidak valid: ${boardValidation.errors.join('; ')}`);
  }

  // Create initialized Player instances
  const players: Player[] = config.players.map((draft, idx) => ({
    id: `player-${idx + 1}-${draft.name.toLowerCase().replace(/\s+/g, '-')}`,
    name: draft.name.trim(),
    controller: draft.controller,
    color: draft.color,
    tokenIcon: draft.tokenIcon,
    balance: config.startingBalance,
    position: 0, // All start at tile 0 (Gajian Pokok)
    netWorth: config.startingBalance,
    isActive: true
  }));

  const initialState: GameState = {
    id: `game-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: Date.now(),
    config: { ...config, players: config.players.map((p) => ({ ...p })) },
    players,
    activePlayerIndex: 0,
    currentRound: 1,
    phase: 'WAITING_ROLL',
    board: boardToUse.map((t) => ({ ...t })),
    selectedTileIndex: 0,
    statusLog: [
      {
        id: 'log-init',
        timestamp: Date.now(),
        message: `Sesi WNI Simulator dimulai. Mode: ${config.mode}. Giliran pertama: ${players[0].name}.`,
        type: 'info'
      }
    ]
  };

  return initialState;
}
