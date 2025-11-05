// Helper functions for precise decimal handling

export function constrainValue(
  value: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, value));
}

export function parseInputValue(input: string): number {
  const parsed = parseFloat(input);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Smart decimal formatter for crypto amounts
 * - Values >= 1: show 2 decimals (e.g., 10.25)
 * - Values < 1: show up to 6 decimals (e.g., 0.001234)
 * - Removes trailing zeros (e.g., 0.001000 → 0.001)
 */
export function formatCryptoAmount(value: number): string {
  if (value === 0) return "0";

  // For values >= 1, use 2 decimals
  if (value >= 1) {
    return value.toFixed(2);
  }

  // For values < 1, use up to 6 decimals and remove trailing zeros
  const formatted = value.toFixed(6);

  let trimmed = formatted;
  while (trimmed.endsWith("0")) {
    trimmed = trimmed.slice(0, -1);
  }

  if (trimmed.endsWith(".")) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed;
}
