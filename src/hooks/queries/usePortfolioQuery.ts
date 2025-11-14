import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryClient";
import {
  getLandingPagePortfolioData,
  getYieldReturnsSummary,
  type LandingPageResponse,
} from "../../services/analyticsService";
import { portfolioLogger } from "../../utils/logger";
import { createQueryConfig } from "./queryDefaults";

// Hook for unified landing page data - Single API call for better performance
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

      // PERFORMANCE FIX: Call only landing page endpoint to reduce parallel load
      // Previously called both getLandingPagePortfolioData + getYieldReturnsSummary
      // This caused double database load and request storms
      const landingData = await getLandingPagePortfolioData(userId);

      // Optionally fetch yield summary separately if needed by specific components
      // For now, rely on backend to include necessary yield data in landing page response
      try {
        // Request multiple windows for better yield insights (7d, 30d, 90d)
        const yieldData = await getYieldReturnsSummary(userId, "7d,30d,90d");
        return {
          ...landingData,
          yield_summary: yieldData,
        };
      } catch (error) {
        portfolioLogger.warn(
          "Failed to fetch yield returns summary for landing page",
          {
            error: error instanceof Error ? error.message : String(error),
            userId,
          }
        );
        // Return landing data without yield summary rather than failing completely
        return landingData;
      }
    },
    enabled: !!userId, // Only run when userId is available
    refetchInterval: 5 * 60 * 1000, // Reduced from 60s to 5min (300s) to match backend cache
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
