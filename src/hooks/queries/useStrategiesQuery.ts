import { useQuery, UseQueryResult } from "@tanstack/react-query";

import type { PoolDetail } from '@/types/domain/pool';
import {
  StrategiesApiError,
  StrategiesFetchConfig,
  transformStrategiesResponse,
} from '@/types/domain/strategies';

import { AssetCategory } from "../../components/PortfolioAllocation/types";
import { queryKeys } from "../../lib/queryClient";
import { getStrategies } from "../../services/intentService";
import { createQueryConfig } from "./queryDefaults";

// Updated retry config to match global HTTP utils (maxRetries: 1)
// Reduces request storms from 3 retries to 1
const STRATEGIES_RETRY_CONFIG = {
  maxRetries: 1, // Reduced from 3 to match http-utils.ts config
  customRetry: (failureCount: number, error: unknown) => {
    if (
      error instanceof StrategiesApiError &&
      error.statusCode &&
      error.statusCode < 500
    ) {
      return false;
    }

    return failureCount < 1; // Updated threshold from 3 to 1
  },
};

const STATIC_STRATEGIES_QUERY_CONFIG = createQueryConfig({
  dataType: "static",
  retryConfig: STRATEGIES_RETRY_CONFIG,
});

const DYNAMIC_STRATEGIES_QUERY_CONFIG = createQueryConfig({
  dataType: "dynamic",
  retryConfig: STRATEGIES_RETRY_CONFIG,
});

function normalizeStrategiesError(error: unknown): StrategiesApiError {
  if (error instanceof StrategiesApiError) {
    return error;
  }

  const message =
    error instanceof Error ? error.message : "Failed to fetch strategies";

  return new StrategiesApiError(message, "FETCH_ERROR");
}

/**
 * React Query hook for fetching portfolio strategies
 */
export function useStrategiesQuery(
  config?: StrategiesFetchConfig
): UseQueryResult<AssetCategory[], StrategiesApiError> {
  return useQuery<AssetCategory[], StrategiesApiError>({
    ...STATIC_STRATEGIES_QUERY_CONFIG,
    queryKey: queryKeys.strategies.list(config),
    queryFn: async (): Promise<AssetCategory[]> => {
      try {
        const apiResponse = await getStrategies();
        return transformStrategiesResponse(apiResponse);
      } catch (error) {
        throw normalizeStrategiesError(error);
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes when tab is active
  });
}

/**
 * React Query hook for fetching strategies with real portfolio data
 *
 * PERFORMANCE OPTIMIZED: Removed duplicate getLandingPagePortfolioData() call.
 * Portfolio data should be passed as a prop or accessed via React Query cache
 * to avoid parallel duplicate requests to the same endpoint.
 */
export function useStrategiesWithPortfolioQuery(
  userId?: string,
  config?: StrategiesFetchConfig,
  poolDetails?: PoolDetail[] // NEW: Accept portfolio data as prop to avoid duplicate API call
): UseQueryResult<AssetCategory[], StrategiesApiError> {
  return useQuery<AssetCategory[], StrategiesApiError>({
    ...DYNAMIC_STRATEGIES_QUERY_CONFIG,
    queryKey: queryKeys.strategies.withPortfolio(userId, config),
    queryFn: async (): Promise<AssetCategory[]> => {
      try {
        // Always fetch base strategies first
        const strategiesResponse = await getStrategies();

        // Use provided poolDetails instead of fetching independently
        // This prevents duplicate API calls to the landing page endpoint
        if (userId && poolDetails) {
          return transformStrategiesResponse(strategiesResponse, poolDetails);
        }

        // Return strategies without portfolio data if not provided
        return transformStrategiesResponse(strategiesResponse, []);
      } catch (error) {
        throw normalizeStrategiesError(error);
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Increased from 2min to 5min to match backend cache
  });
}

/**
 * Helper hook for strategies with portfolio data
 *
 * @param userId - User ID for portfolio data
 * @param config - Strategy fetch configuration
 * @param poolDetails - Optional pool details from portfolio data to avoid duplicate API call
 */
export function useStrategiesWithPortfolioData(
  userId?: string,
  config?: StrategiesFetchConfig,
  poolDetails?: PoolDetail[]
) {
  const query = useStrategiesWithPortfolioQuery(userId, config, poolDetails);

  return {
    strategies: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    // Helper computed values
    hasStrategies: (query.data?.length || 0) > 0,
    totalStrategies: query.data?.length || 0,
    // Loading state helpers
    isInitialLoading: query.isLoading && !query.data,
    isReloading: query.isRefetching || (query.isLoading && !!query.data),
    // Portfolio-specific helpers
    hasPoolData:
      query.data?.some(category => category.protocols?.length > 0) || false,
    totalProtocols:
      query.data?.reduce((sum, cat) => sum + (cat.protocols?.length || 0), 0) ||
      0,
  };
}
