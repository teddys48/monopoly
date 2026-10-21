import type { AssetDefinition } from '../domain/economy';
import { GAME_CONSTANTS } from '../rules/constants';

export const ASSET_DEFINITIONS: readonly AssetDefinition[] = [
  {
    id: 'asset-tile-01',
    tileId: 'tile-01',
    tileIndex: 1,
    name: 'Kawasan Kos Mahasiswa',
    shortName: 'Kawasan Kos',
    category: 'RESIDENSIAL',
    description: 'Hunian sewa bagi mahasiswa dan pekerja muda dengan tingkat okupansi stabil.',
    flavorText: 'Aset sewa properti dengan perputaran kas bulanan yang dapat diandalkan.',
    cost: 1_200_000,
    baseRent: 160_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Home',
    colorBadge: '#0284C7'
  },
  {
    id: 'asset-tile-02',
    tileId: 'tile-02',
    tileIndex: 2,
    name: 'Pasar Rakyat Tradisional',
    shortName: 'Pasar Rakyat',
    category: 'KOMERSIAL',
    description: 'Pusat perdagangan komoditas sembako dan rantai pasok pangan harian masyarakat.',
    flavorText: 'Denyut ekonomi kerakyatan dengan perputaran uang tunai yang sangat cepat.',
    cost: 1_800_000,
    baseRent: 240_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Store',
    colorBadge: '#0284C7'
  },
  {
    id: 'asset-tile-03',
    tileId: 'tile-03',
    tileIndex: 3,
    name: 'Pusat Sentra UMKM',
    shortName: 'Sentra UMKM',
    category: 'KOMERSIAL',
    description: 'Kawasan terpadu pelaku usaha mikro dan kriya kreatif dengan potensi ekspansi pasar.',
    flavorText: 'Tulang punggung ekonomi nasional penyerap tenaga kerja lokal.',
    cost: 2_400_000,
    baseRent: 320_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Briefcase',
    colorBadge: '#0284C7'
  },
  {
    id: 'asset-tile-04',
    tileId: 'tile-04',
    tileIndex: 4,
    name: 'Terminal Bus Antarkota',
    shortName: 'Terminal Antarkota',
    category: 'LOGISTIK',
    description: 'Hub transportasi darat vital penghubung mobilitas tenaga kerja dan distribusi barang.',
    flavorText: 'Arteri mobilitas warga antarwilayah provinsi.',
    cost: 3_000_000,
    baseRent: 400_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Bus',
    colorBadge: '#64748B'
  },
  {
    id: 'asset-tile-05',
    tileId: 'tile-05',
    tileIndex: 5,
    name: 'Pusat Kuliner Malam',
    shortName: 'Kuliner Malam',
    category: 'KOMERSIAL',
    description: 'Sentra kuliner malam kaki lima legendaris dengan margin laba harian menjanjikan.',
    flavorText: 'Aroma rempah dan keramaian pengunjung dari senja hingga dini hari.',
    cost: 2_600_000,
    baseRent: 350_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Utensils',
    colorBadge: '#EA580C'
  },
  {
    id: 'asset-tile-07',
    tileId: 'tile-07',
    tileIndex: 7,
    name: 'Sentra Kerajinan Nusantara',
    shortName: 'Kerajinan Batik',
    category: 'KREATIF',
    description: 'Bengkel produksi batik tulis, ukir kayu, dan kerajinan ekspor berkualitas tinggi.',
    flavorText: 'Warisan budaya yang bermetamorfosis menjadi komoditas devisa ekspor.',
    cost: 3_200_000,
    baseRent: 450_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Sparkles',
    colorBadge: '#EA580C'
  },
  {
    id: 'asset-tile-08',
    tileId: 'tile-08',
    tileIndex: 8,
    name: 'Bank Pembangunan Daerah',
    shortName: 'Bank Daerah',
    category: 'FINANSIAL',
    description: 'Lembaga keuangan penyedia pembiayaan modal, KUR, dan instrumen simpanan kas.',
    flavorText: 'Akses permodalan resmi untuk mendukung ekspansi bisnis produktif.',
    cost: 4_500_000,
    baseRent: 600_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Landmark',
    colorBadge: '#0D9488'
  },
  {
    id: 'asset-tile-10',
    tileId: 'tile-10',
    tileIndex: 10,
    name: 'Kawasan Industri Terpadu',
    shortName: 'Kawasan Industri',
    category: 'INDUSTRI',
    description: 'Pusat manufaktur perakitan dan pabrik pengolahan bernilai tambah tinggi.',
    flavorText: 'Produksi skala besar dengan multiplier effect ekonomi yang luas.',
    cost: 4_800_000,
    baseRent: 650_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Factory',
    colorBadge: '#D97706'
  },
  {
    id: 'asset-tile-12',
    tileId: 'tile-12',
    tileIndex: 12,
    name: 'Pusat Perbelanjaan Modern',
    shortName: 'Pusat Belanja',
    category: 'KOMERSIAL',
    description: 'Mall megah dengan ritel multibrand, bioskop, dan wahana rekreasi perkotaan.',
    flavorText: 'Magnet konsumsi gaya hidup kelas menengah perkotaan.',
    cost: 5_500_000,
    baseRent: 750_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'ShoppingBag',
    colorBadge: '#D97706'
  },
  {
    id: 'asset-tile-13',
    tileId: 'tile-13',
    tileIndex: 13,
    name: 'Pelabuhan Petikemas',
    shortName: 'Pelabuhan Maritim',
    category: 'LOGISTIK',
    description: 'Gerbang maritim ekspor impor kontainer penghubung perdagangan pulau dan dunia.',
    flavorText: 'Urat nadi perdagangan internasional kepulauan Indonesia.',
    cost: 5_000_000,
    baseRent: 700_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Ship',
    colorBadge: '#64748B'
  },
  {
    id: 'asset-tile-15',
    tileId: 'tile-15',
    tileIndex: 15,
    name: 'Kawasan Bisnis Perkantoran CBD',
    shortName: 'Kawasan CBD',
    category: 'KORPORASI',
    description: 'Pusat keuangan terpadu segitiga emas tempat kantor pusat korporasi utama.',
    flavorText: 'Puncak prestise ekonomi metropolitan dengan arus perputaran modal raksasa.',
    cost: 6_500_000,
    baseRent: 900_000,
    resalePolicy: { type: 'PERCENTAGE', percentage: GAME_CONSTANTS.RESALE_RATE_PERCENT },
    icon: 'Building2',
    colorBadge: '#4F46E5'
  }
];

export function getAllAssetDefinitions(): AssetDefinition[] {
  return ASSET_DEFINITIONS.map((asset) => ({ ...asset }));
}

export function getAssetByTileId(tileId: string): AssetDefinition | undefined {
  return ASSET_DEFINITIONS.find((asset) => asset.tileId === tileId);
}

export function getAssetByTileIndex(tileIndex: number): AssetDefinition | undefined {
  return ASSET_DEFINITIONS.find((asset) => asset.tileIndex === tileIndex);
}

export function getAssetById(assetId: string): AssetDefinition | undefined {
  return ASSET_DEFINITIONS.find((asset) => asset.id === assetId);
}
