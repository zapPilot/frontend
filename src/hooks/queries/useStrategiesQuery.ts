import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { createQueryConfig } from "./queryDefaults";
import { getStrategies } from "../../services/intentService";
import { getLandingPagePortfolioData } from "../../services/analyticsService";
import { AssetCategory } from "../../components/PortfolioAllocation/types";
import { portfolioLogger } from "@/utils/logger";
import {
  transformStrategiesResponse,
  StrategiesApiError,
  StrategiesFetchConfig,
} from "../../types/strategies";

/**
 * Query key factory for strategies
 */
export const strategiesKeys = {
  all: ["strategies"] as const,
  lists: () => [...strategiesKeys.all, "list"] as const,
  list: (config?: StrategiesFetchConfig) =>
    [...strategiesKeys.lists(), config] as const,
  withPortfolio: (userId?: string, config?: StrategiesFetchConfig) =>
    [...strategiesKeys.lists(), "portfolio", userId, config] as const,
};

/**
 * React Query hook for fetching portfolio strategies
 */
export function useStrategiesQuery(
  config?: StrategiesFetchConfig
): UseQueryResult<AssetCategory[], StrategiesApiError> {
  return useQuery<AssetCategory[], StrategiesApiError>({
    ...createQueryConfig({
      dataType: "static",
      retryConfig: {
        maxRetries: 3,
        customRetry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (
            error instanceof StrategiesApiError &&
            error.statusCode &&
            error.statusCode < 500
          ) {
            return false;
          }
          return failureCount < 3;
        },
      },
    }),
    queryKey: strategiesKeys.list(config),
    queryFn: async (): Promise<AssetCategory[]> => {
      try {
        const apiResponse = await getStrategies();
        return transformStrategiesResponse(apiResponse);
      } catch (error) {
        // Transform error to StrategiesApiError if needed
        if (error instanceof StrategiesApiError) {
          throw error;
        }

        // Handle API errors from intentService
        const message =
          error instanceof Error ? error.message : "Failed to fetch strategies";
        throw new StrategiesApiError(message, "FETCH_ERROR");
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes when tab is active
  });
}

/**
 * React Query hook for fetching strategies with real portfolio data
 */
export function useStrategiesWithPortfolioQuery(
  userId?: string,
  config?: StrategiesFetchConfig
): UseQueryResult<AssetCategory[], StrategiesApiError> {
  return useQuery<AssetCategory[], StrategiesApiError>({
    ...createQueryConfig({
      dataType: "dynamic",
      retryConfig: {
        maxRetries: 3,
        customRetry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (
            error instanceof StrategiesApiError &&
            error.statusCode &&
            error.statusCode < 500
          ) {
            return false;
          }
          return failureCount < 3;
        },
      },
    }),
    queryKey: strategiesKeys.withPortfolio(userId, config),
    queryFn: async (): Promise<AssetCategory[]> => {
      try {
        // Always fetch base strategies first
        const strategiesResponse = await getStrategies();

        // Conditionally fetch portfolio data if user is authenticated
        if (userId) {
          try {
            const portfolioData = await getLandingPagePortfolioData(userId);
            const poolDetails = portfolioData?.pool_details || [];
            return transformStrategiesResponse(strategiesResponse, poolDetails);
          } catch (portfolioError) {
            // Portfolio fetch failed - log warning but return strategies without portfolio data
            portfolioLogger.warn(
              "Portfolio data fetch failed, showing strategies without portfolio data:",
              portfolioError
            );
            return transformStrategiesResponse(strategiesResponse, []);
          }
        }

        // Return strategies without portfolio data for unauthenticated users
        return transformStrategiesResponse(strategiesResponse, []);
      } catch (error) {
        // Transform error to StrategiesApiError if needed
        if (error instanceof StrategiesApiError) {
          throw error;
        }

        // Handle API errors from intentService
        const message =
          error instanceof Error ? error.message : "Failed to fetch strategies";
        throw new StrategiesApiError(message, "FETCH_ERROR");
      }
    },
    refetchOnWindowFocus: false,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes for portfolio data
  });
}

/**
 * Helper hook for strategies with portfolio data
 */
export function useStrategiesWithPortfolioData(
  userId?: string,
  config?: StrategiesFetchConfig
) {
  const query = useStrategiesWithPortfolioQuery(userId, config);

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

/**
 * Type exports for external use
 */
export type StrategiesQueryResult = ReturnType<typeof useStrategiesQuery>;
