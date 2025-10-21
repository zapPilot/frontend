import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQueryConfig } from "./queryDefaults";
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
    ...createQueryConfig({
      dataType: "realtime",
      retryConfig: {
        skipErrorMessages: ["USER_NOT_FOUND", "404"],
      },
    }),
    queryKey: queryKeys.portfolio.landingPage(userId || ""),
    queryFn: async (): Promise<LandingPageResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Single API call to get all landing page data
      return await getLandingPagePortfolioData(userId);
    },
    enabled: !!userId, // Only run when userId is available
    refetchInterval: 60 * 1000, // Auto-refetch every minute when tab is active
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
