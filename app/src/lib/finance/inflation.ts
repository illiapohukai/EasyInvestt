/**
 * Purchasing power of an amount after `years` of constant inflation,
 * expressed in today's money. Example: 100 € at 2 % for 10 years ≈ 82 €.
 */
export function purchasingPower(amount: number, inflationPercent: number, years: number): number {
  if (!Number.isFinite(amount) || !Number.isFinite(inflationPercent) || !Number.isFinite(years)) {
    return 0;
  }
  return amount / Math.pow(1 + inflationPercent / 100, Math.max(0, years));
}
