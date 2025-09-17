/**
 * ROI utilities
 *
 * Helpers to sort ROI windows by time and format window labels.
 */

/**
 * Convert an ROI window key (e.g., 'roi_30d', 'roi_1y', 'roi_all') to a sortable score in days.
 * Unknown/invalid formats get a very large score so they appear last.
 */
export function deriveRoiWindowSortScore(key: string): number {
  const period = key.replace(/^roi_/, "");
  const match = period.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  if (!Number.isFinite(amount)) {
    return Number.MAX_SAFE_INTEGER;
  }

  switch (unit) {
    case "d":
      return amount;
    case "w":
      return amount * 7;
    case "m":
      return amount * 30;
    case "y":
      return amount * 365;
    default:
      return Number.MAX_SAFE_INTEGER;
  }
}

/**
 * Format an ROI window key to a human-friendly label.
 * Examples: 'roi_30d' -> '30 days', 'roi_1y' -> '1 years', 'roi_all' -> 'All time'.
 */
export function formatRoiWindowLabel(key: string): string {
  const period = key.replace(/^roi_/, "");
  if (period === "all") {
    return "All time";
  }

  const match = period.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (!match) {
    return period;
  }

  const [, amount, unit] = match;
  switch (unit) {
    case "d":
      return `${amount} days`;
    case "w":
      return `${amount} weeks`;
    case "m":
      return `${amount} months`;
    case "y":
      return `${amount} years`;
    default:
      return period;
  }
}
