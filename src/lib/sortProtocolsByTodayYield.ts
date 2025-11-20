import type { ProtocolYieldBreakdown } from "@/services/analyticsService";

/**
 * Sorts protocol yield breakdown by today's yield in descending order.
 *
 * Sorting logic:
 * 1. Protocols WITH today's data → sorted by today.yield_usd DESC (highest first)
 * 2. Protocols WITHOUT today's data (null/undefined) → at the end
 *
 * @param breakdown - Array of protocol yield breakdowns to sort
 * @returns New sorted array (original array is not mutated)
 *
 * @example
 * ```typescript
 * const sorted = sortProtocolsByTodayYield([
 *   { protocol: "Aave", today: { yield_usd: 5.5, date: "2025-01-19" } },
 *   { protocol: "Compound", today: { yield_usd: 12.3, date: "2025-01-19" } },
 *   { protocol: "Uniswap", today: null } // No data → goes to end
 * ]);
 * // Result: [Compound (12.3), Aave (5.5), Uniswap (null)]
 * ```
 */
export function sortProtocolsByTodayYield(
  breakdown: ProtocolYieldBreakdown[]
): ProtocolYieldBreakdown[] {
  // Create a shallow copy to avoid mutating the original array
  const sorted = [...breakdown];

  sorted.sort((a, b) => {
    const aYield = a.today?.yield_usd ?? null;
    const bYield = b.today?.yield_usd ?? null;

    // Both have data → sort by yield DESC (highest first)
    if (aYield !== null && bYield !== null) {
      return bYield - aYield;
    }

    // Only a has data → a comes first
    if (aYield !== null && bYield === null) {
      return -1;
    }

    // Only b has data → b comes first
    if (aYield === null && bYield !== null) {
      return 1;
    }

    // Neither has data → preserve original order (stable sort)
    return 0;
  });

  return sorted;
}
