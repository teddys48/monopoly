import type { EconomicEvent } from '../domain/events';

export const SAMPLE_ECONOMIC_EVENTS: readonly EconomicEvent[] = [
  {
    id: 'evt-01',
    title: 'Subsidi Energi & UMKM Disalurkan',
    category: 'SUBSIDY',
    description:
      'Pemerintah menggelontorkan stimulus pembiayaan modal dan subsidi tarif listrik bagi pelaku usaha kecil.',
    impactHeadline: 'Bantuan likuiditas usaha cair!'
  },
  {
    id: 'evt-02',
    title: 'Kenaikan Suku Bunga Acuan BI',
    category: 'INFLATION',
    description: 'Bank Indonesia menaikkan suku bunga acuan untuk meredam laju inflasi impor.',
    impactHeadline: 'Biaya pinjaman meningkat, simpanan kas lebih menarik.'
  },
  {
    id: 'evt-03',
    title: 'Lonjakan Wisata Musim Liburan',
    category: 'MARKET_BOOM',
    description:
      'Kunjungan wisatawan melonjak signifikan, mendongkrak omzet kuliner dan akomodasi sewa.',
    impactHeadline: 'Pendapatan sektor hospitality naik tajam!'
  },
  {
    id: 'evt-04',
    title: 'Program Amnesti & Pemutihan Denda Pajak',
    category: 'POLICY',
    description:
      'Kementerian Keuangan memberlakukan penghapusan sanksi administrasi pelaporan pajak.',
    impactHeadline: 'Peluang merapikan pembukuan aset usaha.'
  },
  {
    id: 'evt-05',
    title: 'Fluktuasi Harga Komoditas Pangan',
    category: 'CRISIS',
    description: 'Gangguan cuaca menyebabkan keterlambatan pasokan panen pangan ke pasar induk.',
    impactHeadline: 'Margin laba komersial tertekan sementara waktu.'
  }
];

export function getSampleEvents(): EconomicEvent[] {
  return SAMPLE_ECONOMIC_EVENTS.map((e) => ({ ...e }));
}
