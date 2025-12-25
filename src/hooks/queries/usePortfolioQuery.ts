import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/state/queryClient";

import {
  getLandingPagePortfolioData,
  type LandingPageResponse,
} from "../../services/analyticsService";
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
