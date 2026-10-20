import { describe, it, expect } from 'vitest';
import { resolveTile } from '../../src/lib/game/engine/tile-resolution';
import { INDONESIAN_ECONOMY_TILES } from '../../src/lib/game/data/board';
import type { Player } from '../../src/lib/game/domain/player';
import type { BoardTile, TileType } from '../../src/lib/game/domain/board';

describe('Tile Resolution Engine', () => {
  const mockPlayer: Player = {
    id: 'p1',
    name: 'Teddy',
    controller: 'HUMAN',
    color: '#EF4444',
    tokenIcon: 'User',
    balance: 10_000_000,
    position: 0,
    netWorth: 10_000_000,
    isActive: true
  };

  const startTile = INDONESIAN_ECONOMY_TILES[0]; // START
  const propertyTile = INDONESIAN_ECONOMY_TILES[1]; // PROPERTY
  const commercialTile = INDONESIAN_ECONOMY_TILES[2]; // COMMERCIAL
  const restTile = INDONESIAN_ECONOMY_TILES[9]; // REST
  const taxTile = INDONESIAN_ECONOMY_TILES[11]; // TAX
  const eventTile = INDONESIAN_ECONOMY_TILES[6]; // EVENT

  it('resolves START tile without salary reward when crossedStart is false', () => {
    const res = resolveTile(startTile, mockPlayer, { crossedStart: false });
    expect(res.category).toBe('START');
    expect(res.passedStartReward.awarded).toBe(false);
    expect(res.passedStartReward.amount).toBe(0);
    expect(res.financialImpact.amount).toBe(0);
  });

  it('resolves START tile with salary reward when crossedStart is true and configured', () => {
    const res = resolveTile(startTile, mockPlayer, { crossedStart: true, salaryPerLap: 2_000_000 });
    expect(res.category).toBe('START');
    expect(res.passedStartReward.awarded).toBe(true);
    expect(res.passedStartReward.amount).toBe(2_000_000);
    expect(res.description).toContain('2.000.000');
  });

  it('resolves PROPERTY and COMMERCIAL tiles without executing Phase 3 purchases', () => {
    const propRes = resolveTile(propertyTile, mockPlayer);
    expect(propRes.category).toBe('PROPERTY');
    expect(propRes.financialImpact.amount).toBe(0);
    expect(propRes.description).toContain('Fase 3');

    const commRes = resolveTile(commercialTile, mockPlayer);
    expect(commRes.category).toBe('COMMERCIAL');
    expect(commRes.financialImpact.amount).toBe(0);
  });

  it('resolves REST tile as neutral with 0 financial impact', () => {
    const res = resolveTile(restTile, mockPlayer);
    expect(res.category).toBe('REST');
    expect(res.financialImpact.amount).toBe(0);
    expect(res.headline).toContain('Istirahat');
  });

  it('resolves unconfigured TAX tile without penalty', () => {
    // Default tax tile has no baseCost
    const res = resolveTile(taxTile, mockPlayer);
    expect(res.category).toBe('TAX');
    expect(res.financialImpact.amount).toBe(0);
  });

  it('resolves configured expense TAX tile with validated financial penalty', () => {
    const taxWithCost: BoardTile = {
      ...taxTile,
      baseCost: 500_000
    };
    const res = resolveTile(taxWithCost, mockPlayer);
    expect(res.category).toBe('TAX');
    expect(res.financialImpact.amount).toBe(-500_000);
    expect(res.financialImpact.reason).toContain('Pajak');
  });

  it('resolves EVENT tile as informational without crashing or running economy deck', () => {
    const res = resolveTile(eventTile, mockPlayer);
    expect(res.category).toBe('EVENT');
    expect(res.financialImpact.amount).toBe(0);
  });

  it('safely handles unknown or undefined tile gracefully without throwing', () => {
    const res = resolveTile(null, mockPlayer);
    expect(res.category).toBe('UNKNOWN');
    expect(res.financialImpact.amount).toBe(0);
    expect(res.headline).toBe('Petak Tidak Terdaftar');

    const weirdTile = {
      id: 'weird-01',
      index: 99,
      name: 'Misteri',
      shortName: 'Misteri',
      type: 'CUSTOM_SPECIAL' as unknown as TileType,
      description: 'Petak aneh',
      colorBadge: '#000000',
      icon: 'Help'
    };
    const weirdRes = resolveTile(weirdTile, mockPlayer);
    expect(weirdRes.category).toBe('UNKNOWN');
    expect(weirdRes.financialImpact.amount).toBe(0);
  });
});
