import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../lib/queryClient";
import {
  getLandingPagePortfolioData,
  getYieldReturnsSummary,
  type LandingPageResponse,
} from "../../services/analyticsService";
import { portfolioLogger } from "../../utils/logger";
import { createQueryConfig } from "./queryDefaults";

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

      const [landingResult, yieldResult] = await Promise.allSettled([
        getLandingPagePortfolioData(userId),
        getYieldReturnsSummary(userId, 30),
      ]);

      if (landingResult.status === "rejected") {
        throw landingResult.reason;
      }

      const landingData = landingResult.value;

      if (yieldResult.status === "fulfilled") {
        return {
          ...landingData,
          yield_summary: yieldResult.value,
        };
      }

      if (yieldResult.status === "rejected") {
        portfolioLogger.warn(
          "Failed to fetch yield returns summary for landing page",
          {
            error:
              yieldResult.reason instanceof Error
                ? yieldResult.reason.message
                : String(yieldResult.reason),
            userId,
          }
        );
      }

      return landingData;
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
