import { describe, it, expect } from 'vitest';
import { formatRupiah, formatShortRupiah } from '../../src/lib/utils/currency';

describe('Currency Formatter', () => {
  it('formats full Indonesian Rupiah with thousand dots', () => {
    expect(formatRupiah(10_000_000)).toBe('Rp 10.000.000');
    expect(formatRupiah(2_500_000)).toBe('Rp 2.500.000');
    expect(formatRupiah(0)).toBe('Rp 0');
  });

  it('formats compact Indonesian Rupiah correctly', () => {
    expect(formatShortRupiah(10_000_000)).toBe('Rp 10 Jt');
    expect(formatShortRupiah(1_500_000)).toBe('Rp 1.5 Jt');
    expect(formatShortRupiah(450_000)).toBe('Rp 450 Rb');
    expect(formatShortRupiah(500)).toBe('Rp 500');
  });
});
