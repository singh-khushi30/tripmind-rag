export function convertAmount(
  amount: number,
  rate: number | null | undefined,
): number | null {
  if (rate == null || !Number.isFinite(rate) || rate <= 0) return null;
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * rate * 100) / 100;
}
