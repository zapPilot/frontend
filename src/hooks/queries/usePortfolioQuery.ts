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

const PORTFOLIO_REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface PortfolioQueryOptions<T> {
  userId: string | null | undefined;
  queryKey: readonly unknown[];
  fetcher: (userId: string) => Promise<T>;
}

function buildPortfolioQueryConfig<T>({
  userId,
  queryKey,
  fetcher,
}: PortfolioQueryOptions<T>) {
  return {
    ...createQueryConfig({
      dataType: "realtime",
      retryConfig: {
        skipErrorMessages: ["USER_NOT_FOUND", "404"],
      },
    }),
    queryKey,
    queryFn: async (): Promise<T> => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      return fetcher(userId);
    },
    enabled: Boolean(userId),
    refetchInterval: PORTFOLIO_REFETCH_INTERVAL,
  };
}

/**
 * Hook for landing page core data (Balance, ROI, PnL)
 *
 * PERFORMANCE OPTIMIZATION: Fetches only the core portfolio data without yield summary.
 * This allows Balance, ROI, and PnL metrics to render immediately (~300ms) without
 * waiting for the slower yield calculations (~1500ms).
 */
export function useLandingPageData(userId: string | null | undefined) {
  return useQuery(
    buildPortfolioQueryConfig<LandingPageResponse>({
      userId,
      queryKey: queryKeys.portfolio.landingPage(userId || ""),
      fetcher: async resolvedUserId => {
        return getLandingPagePortfolioData(resolvedUserId);
      },
    })
  );
}

/**
 * Hook for yield summary data (Avg Daily Yield)
 *
 * PERFORMANCE OPTIMIZATION: Fetches yield data independently from core metrics.
 * This allows the yield metric to load progressively without blocking Balance/ROI/PnL.
 * Runs in parallel with useLandingPageData for optimal performance.
 */
export function useYieldSummaryData(userId: string | null | undefined) {
  return useQuery(
    buildPortfolioQueryConfig<YieldReturnsSummaryResponse | null>({
      userId,
      queryKey: queryKeys.portfolio.yieldSummary(userId || ""),
      fetcher: async resolvedUserId => {
        try {
          return await getYieldReturnsSummary(resolvedUserId, "7d,30d,90d");
        } catch (error) {
          portfolioLogger.warn("Failed to fetch yield returns summary", {
            error: error instanceof Error ? error.message : String(error),
            userId: resolvedUserId,
          });
          return null;
        }
      },
    })
  );
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
