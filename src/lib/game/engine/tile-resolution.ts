import type { BoardTile } from '../domain/board';
import type { Player } from '../domain/player';
import type { AssetOwnership } from '../domain/economy';
import { formatRupiah } from '../../utils/currency';
import { getAssetByTileId } from '../data/assets';

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
  assetInfo?: {
    assetId: string;
    cost: number;
    baseRent: number;
    isOwned: boolean;
    ownerPlayerId?: string;
    ownerName?: string;
  };
}

export interface TileResolutionContext {
  crossedStart?: boolean;
  salaryPerLap?: number;
  ownerships?: AssetOwnership[];
  players?: Player[];
}

/**
 * Resolves a board tile when a player lands on it.
 * Integrates with asset ownership and economic impact when ownership context is provided.
 * Preserves backward compatibility when ownership context is omitted.
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
    case 'TRANSIT': {
      // If economic ownership context is NOT provided, maintain Phase 2 baseline
      if (!context.ownerships) {
        return {
          ...baseResult,
          headline: `Aset Usaha: ${tile.name}`,
          description: `${tile.description} (Mekanisme pembelian aset akan diaktifkan pada Fase 3).`,
          financialImpact: { amount: 0, reason: '' }
        };
      }

      // Economic Phase 3 resolution
      const asset = getAssetByTileId(tile.id);
      const cost = asset?.cost ?? tile.baseCost ?? 0;
      const baseRent = asset?.baseRent ?? tile.baseRent ?? 0;
      const ownership = asset ? context.ownerships.find((o) => o.assetId === asset.id) : undefined;

      if (!ownership) {
        // Asset is available for purchase
        return {
          ...baseResult,
          headline: `Peluang Akuisisi: ${tile.name}`,
          description: `${tile.description} Aset ini belum dimiliki. Tersedia untuk dibeli seharga ${formatRupiah(cost)} dengan estimasi sewa ${formatRupiah(baseRent)}.`,
          financialImpact: { amount: 0, reason: '' },
          assetInfo: asset
            ? {
                assetId: asset.id,
                cost,
                baseRent,
                isOwned: false
              }
            : undefined
        };
      }

      // Asset is owned
      const owner = context.players?.find((p) => p.id === ownership.ownerPlayerId);
      const isOwner = ownership.ownerPlayerId === player.id;

      if (isOwner) {
        return {
          ...baseResult,
          headline: `Aset Milik Sendiri: ${tile.name}`,
          description: `Anda singgah di tempat usaha milik sendiri. Tidak ada biaya sewa yang dibebankan.`,
          financialImpact: { amount: 0, reason: '' },
          assetInfo: {
            assetId: asset?.id ?? tile.id,
            cost,
            baseRent,
            isOwned: true,
            ownerPlayerId: player.id,
            ownerName: player.name
          }
        };
      }

      // Owned by an opponent: Rent obligation
      return {
        ...baseResult,
        headline: `Singgah di Properti ${owner?.name ?? 'Lawan'}: ${tile.name}`,
        description: `Anda singgah di tempat usaha milik ${owner?.name ?? 'lawan'}. Dikenakan biaya sewa sebesar ${formatRupiah(baseRent)}.`,
        financialImpact: {
          amount: -baseRent,
          reason: `Sewa ${tile.name} (${owner?.name ?? 'Pemilik'})`
        },
        assetInfo: {
          assetId: asset?.id ?? tile.id,
          cost,
          baseRent,
          isOwned: true,
          ownerPlayerId: ownership.ownerPlayerId,
          ownerName: owner?.name ?? 'Pemain Lain'
        }
      };
    }

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
