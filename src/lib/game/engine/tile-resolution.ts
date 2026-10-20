import type { BoardTile } from '../domain/board';
import type { Player } from '../domain/player';
import { formatRupiah } from '../../utils/currency';

export type TileResolutionCategory =
  | 'START'
  | 'PROPERTY'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'TRANSIT'
  | 'REST'
  | 'FINANCIAL'
  | 'TAX'
  | 'EVENT'
  | 'UNKNOWN';

export interface TileResolutionResult {
  tileId: string;
  tileIndex: number;
  tileName: string;
  tileType: string;
  category: TileResolutionCategory;
  headline: string;
  description: string;
  financialImpact: {
    amount: number;
    reason: string;
  };
  passedStartReward: {
    awarded: boolean;
    amount: number;
  };
}

export interface TileResolutionContext {
  crossedStart?: boolean;
  salaryPerLap?: number;
}

/**
 * Resolves a board tile when a player lands on it.
 * Only applies financial impact if explicitly configured.
 * Does not execute Phase 3 asset purchases or complex economy cards.
 */
export function resolveTile(
  tile: BoardTile | undefined | null,
  player: Player,
  context: TileResolutionContext = {}
): TileResolutionResult {
  const salaryAmount =
    context.crossedStart && context.salaryPerLap && context.salaryPerLap > 0
      ? context.salaryPerLap
      : 0;

  const passedStartReward = {
    awarded: salaryAmount > 0,
    amount: salaryAmount
  };

  if (!tile) {
    return {
      tileId: 'unknown',
      tileIndex: -1,
      tileName: 'Petak Tidak Diketahui',
      tileType: 'UNKNOWN',
      category: 'UNKNOWN',
      headline: 'Petak Tidak Terdaftar',
      description: 'Pion berada pada koordinat petak yang tidak tercantum dalam konfigurasi papan.',
      financialImpact: { amount: 0, reason: '' },
      passedStartReward
    };
  }

  const baseResult: Omit<TileResolutionResult, 'headline' | 'description' | 'financialImpact'> = {
    tileId: tile.id,
    tileIndex: tile.index,
    tileName: tile.name,
    tileType: tile.type,
    category: (tile.type as TileResolutionCategory) || 'UNKNOWN',
    passedStartReward
  };

  switch (tile.type) {
    case 'START':
      return {
        ...baseResult,
        category: 'START',
        headline: 'Titik Awal: Gajian Pokok',
        description: passedStartReward.awarded
          ? `Tiba tepat di petak Mulai. Gaji pokok sebesar ${formatRupiah(salaryAmount)} telah diterima.`
          : 'Tiba tepat di petak Mulai. Tidak ada tambahan gaji pokok pada giliran ini.',
        financialImpact: { amount: 0, reason: '' }
      };

    case 'PROPERTY':
    case 'COMMERCIAL':
    case 'OFFICE':
    case 'TRANSIT':
      return {
        ...baseResult,
        headline: `Aset Usaha: ${tile.name}`,
        description: `${tile.description} (Mekanisme pembelian aset akan diaktifkan pada Fase 3).`,
        financialImpact: { amount: 0, reason: '' }
      };

    case 'REST':
      return {
        ...baseResult,
        category: 'REST',
        headline: `Istirahat: ${tile.name}`,
        description: `${tile.description} Operasional bisnis rehat sejenak tanpa pungutan biaya.`,
        financialImpact: { amount: 0, reason: '' }
      };

    case 'FINANCIAL':
      return {
        ...baseResult,
        category: 'FINANCIAL',
        headline: `Lembaga Finansial: ${tile.name}`,
        description: `${tile.description} Akses modal dan tabungan bunga akan dibuka pada pembaruan mendatang.`,
        financialImpact: { amount: 0, reason: '' }
      };

    case 'TAX': {
      // If basic fixed cost is explicitly configured, apply validated engine charge
      if (typeof tile.baseCost === 'number' && tile.baseCost > 0) {
        const taxCost = tile.baseCost;
        return {
          ...baseResult,
          category: 'TAX',
          headline: `Kewajiban Pajak: ${tile.name}`,
          description: `${tile.description} Kontribusi pajak sebesar ${formatRupiah(taxCost)} disetorkan ke kas daerah.`,
          financialImpact: {
            amount: -taxCost,
            reason: `Pajak ${tile.name}`
          }
        };
      }
      return {
        ...baseResult,
        category: 'TAX',
        headline: `Layanan Fiskal: ${tile.name}`,
        description: `${tile.description} Kepatuhan pajak tercatat rapi tanpa pemotongan biaya tambahan pada fase ini.`,
        financialImpact: { amount: 0, reason: '' }
      };
    }

    case 'EVENT':
      return {
        ...baseResult,
        category: 'EVENT',
        headline: `Dinamika Pasar: ${tile.name}`,
        description: `${tile.description} Simulasi kejutan ekonomi penuh akan diintegrasikan pada fase lanjutan.`,
        financialImpact: { amount: 0, reason: '' }
      };

    default:
      return {
        ...baseResult,
        category: 'UNKNOWN',
        headline: `Petak: ${tile.name}`,
        description: tile.description || 'Pemain singgah pada petak tanpa aksi khusus.',
        financialImpact: { amount: 0, reason: '' }
      };
  }
}
