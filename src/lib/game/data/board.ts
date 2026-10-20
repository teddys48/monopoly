import type { BoardTile } from '../domain/board';

export const INDONESIAN_ECONOMY_TILES: readonly BoardTile[] = [
  {
    id: 'tile-00',
    index: 0,
    name: 'Mulai & Gajian Pokok',
    shortName: 'Gajian Pokok',
    type: 'START',
    group: 'TITIK_MULAI',
    description:
      'Titik awal siklus ekonomi. Pemain berhak menerima gaji pokok saat melewati titik ini.',
    flavorText: 'Waktunya gajian! Anggaran bulanan masuk ke rekening.',
    colorBadge: '#10B981',
    icon: 'Coins'
  },
  {
    id: 'tile-01',
    index: 1,
    name: 'Kawasan Kos Mahasiswa',
    shortName: 'Kawasan Kos',
    type: 'PROPERTY',
    group: 'RESIDENSIAL',
    description: 'Hunian sewa bagi mahasiswa dan pekerja muda dengan tingkat okupansi stabil.',
    flavorText: 'Aset sewa properti dengan perputaran kas bulanan yang dapat diandalkan.',
    baseCost: 1_200_000,
    baseRent: 160_000,
    colorBadge: '#0284C7',
    icon: 'Home'
  },
  {
    id: 'tile-02',
    index: 2,
    name: 'Pasar Rakyat Tradisional',
    shortName: 'Pasar Rakyat',
    type: 'COMMERCIAL',
    group: 'KOMERSIAL',
    description: 'Pusat perdagangan komoditas sembako dan rantai pasok pangan harian masyarakat.',
    flavorText: 'Denyut ekonomi kerakyatan dengan perputaran uang tunai yang sangat cepat.',
    baseCost: 1_800_000,
    baseRent: 240_000,
    colorBadge: '#0284C7',
    icon: 'Store'
  },
  {
    id: 'tile-03',
    index: 3,
    name: 'Pusat Sentra UMKM',
    shortName: 'Sentra UMKM',
    type: 'COMMERCIAL',
    group: 'KOMERSIAL',
    description:
      'Kawasan terpadu pelaku usaha mikro dan kriya kreatif dengan potensi ekspansi pasar.',
    flavorText: 'Tulang punggung ekonomi nasional penyerap tenaga kerja lokal.',
    baseCost: 2_400_000,
    baseRent: 320_000,
    colorBadge: '#0284C7',
    icon: 'Briefcase'
  },
  {
    id: 'tile-04',
    index: 4,
    name: 'Terminal Bus Antarkota',
    shortName: 'Terminal Antarkota',
    type: 'TRANSIT',
    group: 'LOGISTIK',
    description:
      'Hub transportasi darat vital penghubung mobilitas tenaga kerja dan distribusi barang.',
    flavorText: 'Arteri mobilitas warga antarwilayah provinsi.',
    baseCost: 3_000_000,
    baseRent: 400_000,
    colorBadge: '#64748B',
    icon: 'Bus'
  },
  {
    id: 'tile-05',
    index: 5,
    name: 'Pusat Kuliner Malam',
    shortName: 'Kuliner Malam',
    type: 'COMMERCIAL',
    group: 'KULINER',
    description: 'Sentra kuliner malam kaki lima legendaris dengan margin laba harian menjanjikan.',
    flavorText: 'Aroma rempah dan keramaian pengunjung dari senja hingga dini hari.',
    baseCost: 2_600_000,
    baseRent: 350_000,
    colorBadge: '#EA580C',
    icon: 'Utensils'
  },
  {
    id: 'tile-06',
    index: 6,
    name: 'Dinamika Peristiwa Ekonomi',
    shortName: 'Peristiwa Ekonomi',
    type: 'EVENT',
    group: 'ACARA',
    description:
      'Guncangan atau berkah makroekonomi: inflasi, suku bunga BI, subsidi, atau tren konsumsi.',
    flavorText: 'Ketidakpastian pasar yang menguji ketahanan strategi finansial pemain.',
    colorBadge: '#8B5CF6',
    icon: 'Zap'
  },
  {
    id: 'tile-07',
    index: 7,
    name: 'Sentra Kerajinan Nusantara',
    shortName: 'Kerajinan Batik',
    type: 'PROPERTY',
    group: 'KREATIF',
    description:
      'Bengkel produksi batik tulis, ukir kayu, dan kerajinan ekspor berkualitas tinggi.',
    flavorText: 'Warisan budaya yang bermetamorfosis menjadi komoditas devisa ekspor.',
    baseCost: 3_200_000,
    baseRent: 450_000,
    colorBadge: '#EA580C',
    icon: 'Sparkles'
  },
  {
    id: 'tile-08',
    index: 8,
    name: 'Bank Pembangunan Daerah',
    shortName: 'Bank Daerah',
    type: 'FINANCIAL',
    group: 'FINANSIAL',
    description: 'Lembaga keuangan penyedia pembiayaan modal, KUR, dan instrumen simpanan kas.',
    flavorText: 'Akses permodalan resmi untuk mendukung ekspansi bisnis produktif.',
    baseCost: 4_500_000,
    baseRent: 600_000,
    colorBadge: '#0D9488',
    icon: 'Landmark'
  },
  {
    id: 'tile-09',
    index: 9,
    name: 'Libur Tanggal Merah',
    shortName: 'Libur Nasional',
    type: 'REST',
    group: 'ISTIRAHAT',
    description: 'Hari libur nasional dan cuti bersama. Operasional bisnis rehat sejenak.',
    flavorText: 'Nikmati waktu berkualitas tanpa beban potongan biaya operasional.',
    colorBadge: '#10B981',
    icon: 'Coffee'
  },
  {
    id: 'tile-10',
    index: 10,
    name: 'Kawasan Industri Terpadu',
    shortName: 'Kawasan Industri',
    type: 'PROPERTY',
    group: 'INDUSTRI',
    description: 'Pusat manufaktur perakitan dan pabrik pengolahan bernilai tambah tinggi.',
    flavorText: 'Produksi skala besar dengan multiplier effect ekonomi yang luas.',
    baseCost: 4_800_000,
    baseRent: 650_000,
    colorBadge: '#D97706',
    icon: 'Factory'
  },
  {
    id: 'tile-11',
    index: 11,
    name: 'Kantor Pajak Pratama',
    shortName: 'Kantor Pajak',
    type: 'TAX',
    group: 'KEBIJAKAN',
    description: 'Kewajiban kontribusi fiskal tahunan untuk membiayai fasilitas publik bersama.',
    flavorText: 'Pajak kita untuk pembangunan infrastruktur dan perlindungan sosial.',
    colorBadge: '#DC2626',
    icon: 'Receipt'
  },
  {
    id: 'tile-12',
    index: 12,
    name: 'Pusat Perbelanjaan Modern',
    shortName: 'Pusat Belanja',
    type: 'COMMERCIAL',
    group: 'KOMERSIAL',
    description: 'Mall megah dengan ritel multibrand, bioskop, dan wahana rekreasi perkotaan.',
    flavorText: 'Magnet konsumsi gaya hidup kelas menengah perkotaan.',
    baseCost: 5_500_000,
    baseRent: 750_000,
    colorBadge: '#D97706',
    icon: 'ShoppingBag'
  },
  {
    id: 'tile-13',
    index: 13,
    name: 'Pelabuhan Petikemas',
    shortName: 'Pelabuhan Maritim',
    type: 'TRANSIT',
    group: 'LOGISTIK',
    description: 'Gerbang maritim ekspor impor kontainer penghubung perdagangan pulau dan dunia.',
    flavorText: 'Urat nadi perdagangan internasional kepulauan Indonesia.',
    baseCost: 5_000_000,
    baseRent: 700_000,
    colorBadge: '#64748B',
    icon: 'Ship'
  },
  {
    id: 'tile-14',
    index: 14,
    name: 'Peluang Hibah & Kemitraan',
    shortName: 'Peluang Usaha',
    type: 'EVENT',
    group: 'ACARA',
    description: 'Akselerator modal usaha, hibah kompetitif CSR, atau kemitraan korporasi.',
    flavorText: 'Peluang emas bagi wirausahawan yang siap berinovasi.',
    colorBadge: '#8B5CF6',
    icon: 'TrendingUp'
  },
  {
    id: 'tile-15',
    index: 15,
    name: 'Kawasan Bisnis Perkantoran CBD',
    shortName: 'Kawasan CBD',
    type: 'OFFICE',
    group: 'KORPORASI',
    description: 'Pusat keuangan terpadu segitiga emas tempat kantor pusat korporasi utama.',
    flavorText: 'Puncak prestise ekonomi metropolitan dengan arus perputaran modal raksasa.',
    baseCost: 6_500_000,
    baseRent: 900_000,
    colorBadge: '#4F46E5',
    icon: 'Building2'
  }
];

export function getInitialBoardTiles(): BoardTile[] {
  // Return deep clone of board tiles so consumers cannot mutate the master template
  return INDONESIAN_ECONOMY_TILES.map((tile) => ({ ...tile }));
}
