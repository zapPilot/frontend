import { useQuery } from "@tanstack/react-query";

import { getBtcPriceHistory } from "@/services/btcPriceService";

import { createQueryConfig } from "./queryDefaults";

/**
 * React Query hook for fetching BTC historical price data
 *
 * Provides real BTC price data from analytics-engine for portfolio benchmarking.
 * Data is collected daily at midnight UTC via alpha-etl and stored in Supabase.
 *
 * @param days - Number of days of history (1-365, default: 90)
 * @returns React Query result with BTC price history
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useBtcPriceQuery(90);
 *
 * if (data?.snapshots) {
 *   console.log(`Loaded ${data.count} BTC price snapshots`);
 * }
 * ```
 */
export function useBtcPriceQuery(days = 90) {
  return useQuery({
    queryKey: ["btc-price-history", days],
    queryFn: () => getBtcPriceHistory(days),
    ...createQueryConfig({
      dataType: "etl", // ETL-based data with daily updates
    }),
    refetchOnWindowFocus: false,
  });
}
