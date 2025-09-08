/**
 * Portfolio Analytics Hook
 *
 * React Query hook for fetching comprehensive portfolio analytics data
 * from the analytics-engine backend, including performance metrics,
 * risk assessment, and asset allocation analysis.
 */

import { useQuery } from "@tanstack/react-query";
import { useUser } from "../contexts/UserContext";
import {
  getPortfolioAnalytics,
  PortfolioAnalyticsResponse,
} from "../services/analyticsEngine";

export interface UsePortfolioAnalyticsOptions {
  period?: string;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export interface UsePortfolioAnalyticsReturn {
  data: PortfolioAnalyticsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Hook to fetch portfolio analytics data
 *
 * @param options Configuration options for the query
 * @returns Portfolio analytics query result
 */
export const usePortfolioAnalytics = (
  options: UsePortfolioAnalyticsOptions = {}
): UsePortfolioAnalyticsReturn => {
  const { userInfo } = useUser();
  const {
    period = "3M",
    enabled = true,
    staleTime = 1000 * 60 * 5, // 5 minutes
    gcTime = 1000 * 60 * 10, // 10 minutes
  } = options;

  const query = useQuery({
    queryKey: ["portfolioAnalytics", userInfo?.userId, period],
    queryFn: async (): Promise<PortfolioAnalyticsResponse> => {
      if (!userInfo?.userId) {
        throw new Error("User ID is required for portfolio analytics");
      }
      return getPortfolioAnalytics(userInfo.userId, period);
    },
    enabled: enabled && !!userInfo?.userId,
    staleTime,
    gcTime,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Keep previous data while fetching new data
    placeholderData: previousData => previousData,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  } as UsePortfolioAnalyticsReturn;
};

/**
 * Hook to fetch portfolio analytics with automatic period switching
 *
 * @param period Analysis period (1D, 1W, 1M, 3M, 6M, 1Y)
 * @returns Portfolio analytics query result
 */
export const usePortfolioAnalyticsByPeriod = (
  period: string
): UsePortfolioAnalyticsReturn => {
  return usePortfolioAnalytics({ period });
};

/**
 * Hook to prefetch portfolio analytics for multiple periods
 * Useful for warming cache when user might switch periods
 */
export const usePrefetchPortfolioAnalytics = () => {
  const { userInfo } = useUser();

  // This would typically be implemented with queryClient.prefetchQuery
  // but for now we'll keep it simple and just expose the ability
  const prefetchPeriod = (period: string) => {
    if (!userInfo?.userId) return;

    // Implementation would go here using queryClient
    console.log(`Prefetching analytics for period: ${period}`);
  };

  return { prefetchPeriod };
};
