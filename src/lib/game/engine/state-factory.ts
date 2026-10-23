import type { GameConfig } from '../domain/game-config';
import type { GameState } from '../domain/game-state';
import type { Player } from '../domain/player';
import type { BoardTile } from '../domain/board';
import { validateGameConfig, validateBoardIntegrity } from '../rules/validation';
import { getInitialBoardTiles } from '../data/board';
import { ECONOMIC_CONSTANTS } from '../rules/constants';

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
    isActive: true,
    employment: {
      type: 'KARYAWAN',
      status: 'EMPLOYED',
      monthlySalary: ECONOMIC_CONSTANTS.DEFAULT_MONTHLY_SALARY,
      baseSalary: ECONOMIC_CONSTANTS.DEFAULT_MONTHLY_SALARY,
      jobTitle: idx === 0 ? 'Karyawan Swasta' : 'Spesialis Operasional'
    },
    unpaidObligations: 0
  }));

  const initialState: GameState = {
    id: `game-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: Date.now(),
    config: { ...config, players: config.players.map((p) => ({ ...p })) },
    players,
    activePlayerIndex: 0,
    currentRound: 1,
    currentMonth: 1,
    lastSettledMonth: 0,
    indicators: {
      currentMonth: 1,
      inflationIndex: ECONOMIC_CONSTANTS.BASE_INFLATION_INDEX,
      currentInflationRate: ECONOMIC_CONSTANTS.DEFAULT_MONTHLY_INFLATION_RATE,
      condition: 'STABLE'
    },
    loans: [],
    activeEvents: [],
    settlements: [],
    livingExpenses: { ...ECONOMIC_CONSTANTS.DEFAULT_LIVING_EXPENSES },
    lastSettlementSummary: null,
    phase: 'WAITING_ROLL',
    board: boardToUse.map((t) => ({ ...t })),
    ownerships: [],
    transactions: [],
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
