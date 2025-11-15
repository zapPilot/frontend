import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryClient";
import {
  getLandingPagePortfolioData,
  getYieldReturnsSummary,
  type LandingPageResponse,
  type YieldReturnsSummaryResponse,
} from "../../services/analyticsService";
import { portfolioLogger } from "../../utils/logger";
import { createQueryConfig } from "./queryDefaults";

/**
 * Hook for landing page core data (Balance, ROI, PnL)
 *
 * PERFORMANCE OPTIMIZATION: Fetches only the core portfolio data without yield summary.
 * This allows Balance, ROI, and PnL metrics to render immediately (~300ms) without
 * waiting for the slower yield calculations (~1500ms).
 */
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

      // Fetch only core landing page data (Balance, ROI, PnL)
      // Yield data is fetched separately via useYieldSummaryData for progressive loading
      return await getLandingPagePortfolioData(userId);
    },
    enabled: !!userId, // Only run when userId is available
    refetchInterval: 5 * 60 * 1000, // 5min to match backend cache
  });
}

/**
 * Hook for yield summary data (Avg Daily Yield)
 *
 * PERFORMANCE OPTIMIZATION: Fetches yield data independently from core metrics.
 * This allows the yield metric to load progressively without blocking Balance/ROI/PnL.
 * Runs in parallel with useLandingPageData for optimal performance.
 */
export function useYieldSummaryData(userId: string | null | undefined) {
  return useQuery({
    ...createQueryConfig({
      dataType: "realtime",
      retryConfig: {
        skipErrorMessages: ["USER_NOT_FOUND", "404"],
      },
    }),
    queryKey: queryKeys.portfolio.yieldSummary(userId || ""),
    queryFn: async (): Promise<YieldReturnsSummaryResponse | null> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      try {
        // Request multiple windows for better yield insights (7d, 30d, 90d)
        return await getYieldReturnsSummary(userId, "7d,30d,90d");
      } catch (error) {
        portfolioLogger.warn("Failed to fetch yield returns summary", {
          error: error instanceof Error ? error.message : String(error),
          userId,
        });
        // Return null rather than failing - component will handle gracefully
        return null;
      }
    },
    enabled: !!userId, // Only run when userId is available
    refetchInterval: 5 * 60 * 1000, // 5min to match backend cache
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
