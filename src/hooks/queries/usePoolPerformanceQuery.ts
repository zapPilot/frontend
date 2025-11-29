/**
 * React Query hook for pool performance data
 *
 * Provides pool-level analytics with APR data from multiple sources.
 * Implements progressive loading pattern - loads after landing page data.
 */

import { useQuery } from "@tanstack/react-query";

import * as analyticsService from "../../services/analyticsService";
import type { PoolDetail } from '@/types/domain/pool';

/**
 * Fetch pool performance data for a user
 *
 * Returns pool-level metrics including:
 * - Asset values and portfolio contribution
 * - APR data from DeFiLlama and Hyperliquid
 * - Protocol and chain information
 * - Pool token composition
 *
 * Caching strategy:
 * - staleTime: 12 hours (matches backend ETL pattern)
 * - gcTime: 24 hours (garbage collection)
 * - refetchInterval: 5 minutes (progressive updates)
 *
 * @param userId - User wallet address or user ID
 * @returns React Query result with pool performance data
 *
 * @example
 * function PoolTable({ userId }) {
 *   const { data: pools, isLoading, error } = usePoolPerformance(userId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return pools.map(pool => (
 *     <PoolRow key={pool.snapshot_id} pool={pool} />
 *   ));
 * }
 */
export function usePoolPerformance(userId: string | undefined) {
  return useQuery<PoolDetail[], Error>({
    queryKey: ["pools", "performance", userId],
    queryFn: () => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return analyticsService.getPoolPerformance(userId);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours (matches backend cache)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (garbage collection)
    refetchInterval: 1000 * 60 * 5, // 5 minutes (progressive updates)
    retry: 2, // Retry failed requests twice
  });
}
