import { useQuery } from "@tanstack/react-query";

import { getAllocationWeights } from "@/services/allocationService";

import { createQueryConfig } from "../queryDefaults";

/**
 * React Query hook for fetching marketcap-weighted allocation weights
 *
 * Provides BTC/ETH allocation weights based on current market caps
 * for dynamic target portfolio visualization.
 *
 * @returns React Query result with allocation weights
 *
 * @example
 * ```typescript
 * const { data: weights } = useAllocationWeights();
 *
 * // Use weights to calculate target allocations
 * const btcTarget = cryptoPercent * (weights?.btc_weight ?? 0.6);
 * const ethTarget = cryptoPercent * (weights?.eth_weight ?? 0.4);
 * ```
 */
export function useAllocationWeights() {
  return useQuery({
    queryKey: ["allocation-weights"],
    queryFn: getAllocationWeights,
    ...createQueryConfig({
      dataType: "etl", // ETL-based data, updates daily
    }),
    staleTime: 1000 * 60 * 60, // 1 hour - matches backend cache
    refetchOnWindowFocus: false,
  });
}
