/**
 * Formats a numeric value into standard Indonesian Rupiah representation.
 * Example: 10000000 -> "Rp 10.000.000"
 */
export function formatRupiah(amount: number): string {
  const formatted = Math.floor(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Compact Indonesian Rupiah representation for space-constrained UI badges.
 * Example: 10000000 -> "Rp 10 Jt", 450000 -> "Rp 450 Rb"
 */
export function formatShortRupiah(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    const val = (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${val} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `Rp ${val} Jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    const val = (amount / 1_000).toFixed(0);
    return `Rp ${val} Rb`;
  }
  return `Rp ${amount}`;
}
