import type { GameConfig, PlayerDraft } from '../domain/game-config';
import type { BoardTile } from '../domain/board';
import { GAME_CONSTANTS, PLAYER_COLORS } from './constants';

export interface ValidationSuccess<T> {
  isValid: true;
  data: T;
  errors: [];
}

export interface ValidationFailure {
  isValid: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates a game configuration object.
 */
export function validateGameConfig(config: unknown): ValidationResult<GameConfig> {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { isValid: false, errors: ['Konfigurasi permainan harus berupa objek.'] };
  }

  const raw = config as Partial<GameConfig>;

  // Validate Game Mode
  if (!raw.mode) {
    errors.push('Mode permainan harus dipilih.');
  } else if ((GAME_CONSTANTS.UNSUPPORTED_GAME_MODES as readonly string[]).includes(raw.mode)) {
    errors.push(`Mode "${raw.mode}" belum didukung pada fase ini.`);
  } else if (!(GAME_CONSTANTS.SUPPORTED_GAME_MODES as readonly string[]).includes(raw.mode)) {
    errors.push(`Mode permainan "${raw.mode}" tidak valid.`);
  }

  // Validate Player Count
  if (typeof raw.playerCount !== 'number' || Number.isNaN(raw.playerCount)) {
    errors.push('Jumlah pemain harus berupa angka numerik.');
  } else if (
    raw.playerCount < GAME_CONSTANTS.MIN_PLAYERS ||
    raw.playerCount > GAME_CONSTANTS.MAX_PLAYERS
  ) {
    errors.push(
      `Jumlah pemain harus antara ${GAME_CONSTANTS.MIN_PLAYERS} dan ${GAME_CONSTANTS.MAX_PLAYERS}.`
    );
  }

  // Validate Starting Balance
  if (typeof raw.startingBalance !== 'number' || raw.startingBalance <= 0) {
    errors.push('Modal awal pemain harus berupa angka positif.');
  }

  // Validate Players List
  if (!Array.isArray(raw.players)) {
    errors.push('Daftar pemain harus berupa array.');
  } else {
    if (raw.playerCount && raw.players.length !== raw.playerCount) {
      errors.push(
        `Jumlah entri pemain (${raw.players.length}) tidak sesuai dengan playerCount (${raw.playerCount}).`
      );
    }

    const seenNames = new Set<string>();
    const seenColors = new Map<string, string[]>();

    raw.players.forEach((p: PlayerDraft, idx: number) => {
      const playerNum = idx + 1;
      if (!p || typeof p !== 'object') {
        errors.push(`Pemain #${playerNum} tidak terdefinisi dengan benar.`);
        return;
      }

      const trimmedName = typeof p.name === 'string' ? p.name.trim() : '';
      if (!trimmedName) {
        errors.push(`Nama pemain #${playerNum} tidak boleh kosong.`);
      } else if (seenNames.has(trimmedName.toLowerCase())) {
        errors.push(
          `Nama pemain "${trimmedName}" terduplikasi. Setiap pemain harus memiliki nama unik.`
        );
      } else {
        seenNames.add(trimmedName.toLowerCase());
      }

      if (p.controller !== 'HUMAN' && p.controller !== 'AI') {
        errors.push(`Kontroler pemain #${playerNum} harus berupa "HUMAN" atau "AI".`);
      }

      if (!p.color) {
        errors.push(`Warna pion pemain #${playerNum} harus dipilih.`);
      } else {
        const owners = seenColors.get(p.color) ?? [];
        owners.push(trimmedName || `Pemain #${playerNum}`);
        seenColors.set(p.color, owners);
      }
    });

    seenColors.forEach((owners, hex) => {
      if (owners.length > 1) {
        const colorName = PLAYER_COLORS.find((c) => c.hex === hex)?.name ?? hex;
        errors.push(
          `Warna pion "${colorName}" dipakai oleh lebih dari satu pemain (${owners.join(', ')}). Setiap pemain harus memakai warna berbeda.`
        );
      }
    });

    // In BOT mode, at least one player must be HUMAN and at least one must be AI
    if (raw.mode === 'BOT' && raw.players.length >= 2) {
      const hasHuman = raw.players.some((p) => p.controller === 'HUMAN');
      const hasAi = raw.players.some((p) => p.controller === 'AI');
      if (!hasHuman) {
        errors.push('Mode Lawan Bot membutuhkan minimal satu pemain manusia.');
      }
      if (!hasAi) {
        errors.push('Mode Lawan Bot membutuhkan minimal satu pemain bot AI.');
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: config as GameConfig,
    errors: []
  };
}

/**
 * Validates the structural and logical integrity of the board tiles dataset.
 */
export function validateBoardIntegrity(tiles: readonly BoardTile[]): ValidationResult<BoardTile[]> {
  const errors: string[] = [];

  if (!Array.isArray(tiles) || tiles.length === 0) {
    return { isValid: false, errors: ['Papan permainan tidak boleh kosong.'] };
  }

  if (tiles.length !== GAME_CONSTANTS.BOARD_TILE_COUNT) {
    errors.push(
      `Papan permainan harus memiliki tepat ${GAME_CONSTANTS.BOARD_TILE_COUNT} petak (ditemukan: ${tiles.length}).`
    );
  }

  const seenIds = new Set<string>();
  const seenIndices = new Set<number>();
  let hasStartTile = false;

  tiles.forEach((tile, expectedIndex) => {
    if (!tile.id) {
      errors.push(`Petak pada indeks ${expectedIndex} tidak memiliki ID.`);
    } else if (seenIds.has(tile.id)) {
      errors.push(`ID petak duplikat ditemukan: "${tile.id}".`);
    } else {
      seenIds.add(tile.id);
    }

    if (tile.index !== expectedIndex) {
      errors.push(
        `Indeks petak tidak berurutan: petak "${tile.name}" berindeks ${tile.index}, diharapkan ${expectedIndex}.`
      );
    }

    if (seenIndices.has(tile.index)) {
      errors.push(`Indeks petak duplikat: ${tile.index}.`);
    } else {
      seenIndices.add(tile.index);
    }

    if (!tile.name || !tile.name.trim()) {
      errors.push(`Petak pada indeks ${expectedIndex} memiliki nama kosong.`);
    }

    if (tile.type === 'START') {
      hasStartTile = true;
    }

    // Property / Commercial validation
    if (tile.type === 'PROPERTY' || tile.type === 'COMMERCIAL') {
      if (typeof tile.baseCost !== 'number' || tile.baseCost <= 0) {
        errors.push(`Petak "${tile.name}" harus memiliki nilai baseCost positif.`);
      }
      if (typeof tile.baseRent !== 'number' || tile.baseRent <= 0) {
        errors.push(`Petak "${tile.name}" harus memiliki nilai baseRent positif.`);
      }
    }
  });

  if (!hasStartTile) {
    errors.push('Papan permainan harus memiliki minimal satu petak bertipe "START".');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    data: [...tiles],
    errors: []
  };
}
