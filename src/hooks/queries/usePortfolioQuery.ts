import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryClient";
import {
  getLandingPagePortfolioData,
  type LandingPageResponse,
} from "../../services/analyticsService";
import type { AssetCategory, PieChartData } from "../../types/portfolio";
import { portfolioLogger } from "../../utils/logger";

export interface UsePortfolioQueryReturn {
  totalValue: number | null;
  categories: AssetCategory[] | null;
  pieChartData: PieChartData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  isRefetching: boolean;
}

// Hook for unified landing page data - replaces dual API calls
export function useLandingPageData(userId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.portfolio.landingPage(userId || ""),
    queryFn: async (): Promise<LandingPageResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Single API call to get all landing page data
      return await getLandingPagePortfolioData(userId);
    },
    enabled: !!userId, // Only run when userId is available
    staleTime: 30 * 1000, // Portfolio data is stale after 30 seconds (DeFi changes quickly)
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every minute when tab is active
    retry: (failureCount, error) => {
      // Don't retry USER_NOT_FOUND errors
      if (error instanceof Error && error.message.includes("USER_NOT_FOUND")) {
        return false;
      }
      // Don't retry 404 errors (user has no portfolio data)
      if (error instanceof Error && error.message.includes("404")) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
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
      portfolioLogger.info("Portfolio refreshed successfully");
    },
    onError: error => {
      portfolioLogger.error("Failed to refresh portfolio", error);
    },
  });
}
