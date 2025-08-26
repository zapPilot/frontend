import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryKeys } from "../../lib/queryClient";
import { parsePortfolioSummary } from "../../schemas/portfolioApi";
import { getPortfolioSummary } from "../../services/analyticsEngine";
import type { AssetCategory, PieChartData } from "../../types/portfolio";
import { transformPortfolioSummary } from "../../utils/portfolio.mapper";
import {
  portfolioStateUtils,
  preparePortfolioDataWithBorrowing,
} from "../../utils/portfolio.utils";
import { debugLog } from "../../utils/debug";

export interface UsePortfolioQueryReturn {
  totalValue: number | null;
  categories: AssetCategory[] | null;
  pieChartData: PieChartData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isRefetching: boolean;
}

// Hook to get portfolio summary data
export function usePortfolioSummary(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.portfolio.summary(userId || ""),
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Fetch raw API response
      const rawResponse = await getPortfolioSummary(userId, true);

      // Validate and parse API response with Zod
      const summary = parsePortfolioSummary(rawResponse);

      // Transform API response using utility function
      const result = transformPortfolioSummary(summary);

      // Get final total value with proper handling of net vs gross
      const totalValue = Number.isFinite(summary.metrics.total_value_usd)
        ? summary.metrics.total_value_usd
        : 0;

      return {
        totalValue,
        categories: portfolioStateUtils.hasItems(result.categories)
          ? result.categories
          : null,
        rawSummary: summary,
      };
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 30 * 1000, // Portfolio data is stale after 30 seconds (DeFi changes quickly)
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every minute when tab is active
    retry: (failureCount, error) => {
      // Don't retry USER_NOT_FOUND errors
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        return false;
      }
      // Retry validation errors once (might be temporary API issues)
      if (
        error instanceof Error &&
        error.message.includes("Portfolio API validation failed")
      ) {
        return failureCount < 1;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}

// Combined hook that provides the same interface as the old usePortfolioData
export function usePortfolioDisplayData(
  userId: string | null | undefined
): UsePortfolioQueryReturn {
  const portfolioQuery = usePortfolioSummary(userId);

  // Calculate pie chart data from categories with borrowing separation (memoized for performance)
  const pieChartData = useMemo(() => {
    if (portfolioStateUtils.hasItems(portfolioQuery.data?.categories)) {
      // Use borrowing-aware data preparation for accurate pie chart weights
      const processedData = preparePortfolioDataWithBorrowing(
        portfolioQuery.data!.categories,
        portfolioQuery.data!.totalValue,
        "usePortfolioDisplayData-pieChart"
      );
      return processedData.pieChartData;
    }
    return null;
  }, [portfolioQuery.data]);

  return {
    totalValue: portfolioQuery.data?.totalValue || null,
    categories: portfolioQuery.data?.categories || null,
    pieChartData,
    isLoading: portfolioQuery.isLoading,
    error: portfolioQuery.error?.message || null,
    refetch: portfolioQuery.refetch,
    isRefetching: portfolioQuery.isRefetching,
  };
}

// Mutation for manual portfolio refresh
export function useRefreshPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Invalidate portfolio cache
      await queryClient.invalidateQueries({
        queryKey: queryKeys.portfolio.summary(userId),
      });

      // Refetch portfolio data
      return queryClient.fetchQuery({
        queryKey: queryKeys.portfolio.summary(userId),
      });
    },
    onSuccess: () => {
      // Could add success toast here if needed
      debugLog.info("Portfolio refreshed successfully");
    },
    onError: error => {
      debugLog.error("Failed to refresh portfolio:", error);
    },
  });
}
