import { describe, it, expect } from 'vitest';
import { validateBoardIntegrity } from '../../src/lib/game/rules/validation';
import { INDONESIAN_ECONOMY_TILES, getInitialBoardTiles } from '../../src/lib/game/data/board';
import { GAME_CONSTANTS } from '../../src/lib/game/rules/constants';

describe('Board Definition Integrity', () => {
  it('validates default Indonesian Economy Board successfully', () => {
    const tiles = getInitialBoardTiles();
    const result = validateBoardIntegrity(tiles);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it(`has exactly ${GAME_CONSTANTS.BOARD_TILE_COUNT} tiles`, () => {
    expect(INDONESIAN_ECONOMY_TILES).toHaveLength(GAME_CONSTANTS.BOARD_TILE_COUNT);
  });

  it('guarantees unique tile IDs across all tiles', () => {
    const ids = INDONESIAN_ECONOMY_TILES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('guarantees sequential 0-indexed positions', () => {
    INDONESIAN_ECONOMY_TILES.forEach((tile, expectedIndex) => {
      expect(tile.index).toBe(expectedIndex);
    });
  });

  it('starts with a START tile at index 0', () => {
    expect(INDONESIAN_ECONOMY_TILES[0].type).toBe('START');
    expect(INDONESIAN_ECONOMY_TILES[0].index).toBe(0);
  });

  it('ensures all PROPERTY and COMMERCIAL tiles have valid positive cost and rent values', () => {
    const economicTiles = INDONESIAN_ECONOMY_TILES.filter(
      (t) => t.type === 'PROPERTY' || t.type === 'COMMERCIAL'
    );
    expect(economicTiles.length).toBeGreaterThan(0);
    for (const tile of economicTiles) {
      expect(tile.baseCost).toBeGreaterThan(0);
      expect(tile.baseRent).toBeGreaterThan(0);
    }
  });

  it('rejects boards with duplicate tile IDs', () => {
    const tiles = getInitialBoardTiles();
    tiles[1].id = tiles[0].id; // duplicate
    const result = validateBoardIntegrity(tiles);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('duplikat'))).toBe(true);
  });

  it('rejects boards without a START tile', () => {
    const tiles = getInitialBoardTiles();
    tiles[0].type = 'COMMERCIAL';
    tiles[0].baseCost = 1000;
    tiles[0].baseRent = 100;
    const result = validateBoardIntegrity(tiles);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('START'))).toBe(true);
  });
});
