import { useQuery } from "@tanstack/react-query";

import { getBtcPriceHistory } from "@/services/btcPriceService";

import { createQueryConfig } from "../queryDefaults";

/**
 * React Query hook for fetching token historical price data
 *
 * Provides real token price data from analytics-engine for portfolio benchmarking.
 * Data is collected daily at midnight UTC via alpha-etl and stored in Supabase.
 * Supports multiple tokens (BTC, ETH, SOL, etc.) with backward compatibility.
 *
 * @param days - Number of days of history (1-365, default: 90)
 * @param token - Token symbol (default: 'btc', case insensitive)
 * @returns React Query result with token price history
 *
 * @example
 * ```typescript
 * // Fetch BTC price history (backward compatible)
 * const { data, isLoading, error } = useBtcPriceQuery(90);
 *
 * // Fetch ETH price history
 * const ethQuery = useBtcPriceQuery(90, 'eth');
 *
 * if (data?.snapshots) {
 *   console.log(`Loaded ${data.count} price snapshots`);
 * }
 * ```
 */
export function useBtcPriceQuery(days = 90, token = "btc") {
  return useQuery({
    queryKey: ["btc-price-history", days, token.toLowerCase()],
    queryFn: () => getBtcPriceHistory(days, token),
    ...createQueryConfig({
      dataType: "etl", // ETL-based data with daily updates
    }),
    refetchOnWindowFocus: false,
  });
}
