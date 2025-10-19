import { useCallback } from "react";
import { getPortfolioTrends } from "../services/analyticsService";
import { PortfolioDataPoint } from "../types/portfolio";
import { useAnalyticsData } from "./useAnalyticsData";

interface UsePortfolioTrendsConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UsePortfolioTrendsReturn {
  data: PortfolioDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Transforms portfolio trends API response to normalized PortfolioDataPoint array
 */
function transformPortfolioTrends(
  trendResponse: Awaited<ReturnType<typeof getPortfolioTrends>>
): PortfolioDataPoint[] {
  const dailyTotals = Array.isArray(trendResponse?.daily_totals)
    ? trendResponse.daily_totals
    : [];

  return dailyTotals.map(dailyTotal => {
    const totalValue =
      typeof dailyTotal.total_value_usd === "number"
        ? dailyTotal.total_value_usd
        : 0;
    const changePercentage =
      typeof dailyTotal.change_percentage === "number"
        ? dailyTotal.change_percentage
        : 0;

    const protocols = Array.isArray(dailyTotal.protocols)
      ? dailyTotal.protocols.map(protocol => ({
          protocol: protocol?.protocol ?? "",
          chain: protocol?.chain ?? "",
          value:
            typeof protocol?.value_usd === "number" ? protocol.value_usd : 0,
          pnl: typeof protocol?.pnl_usd === "number" ? protocol.pnl_usd : 0,
          ...(typeof protocol?.source_type === "string"
            ? { sourceType: protocol.source_type.toLowerCase() }
            : {}),
          ...(typeof protocol?.category === "string" && protocol.category
            ? { category: protocol.category }
            : {}),
        }))
      : [];

    const categories = Array.isArray(dailyTotal.categories)
      ? dailyTotal.categories.map(category => ({
          category: category?.category ?? "",
          value:
            typeof category?.value_usd === "number" ? category.value_usd : 0,
          pnl: typeof category?.pnl_usd === "number" ? category.pnl_usd : 0,
          ...(typeof category?.source_type === "string"
            ? { sourceType: category.source_type.toLowerCase() }
            : {}),
        }))
      : [];

    const dataPoint: PortfolioDataPoint = {
      date: dailyTotal.date,
      value: totalValue,
      change: changePercentage,
      benchmark: totalValue * 0.95,
      protocols,
      categories,
    };

    if (typeof dailyTotal.chains_count === "number") {
      dataPoint.chainsCount = dailyTotal.chains_count;
    }

    return dataPoint;
  });
}

/**
 * Hook to fetch and transform portfolio trends from analytics-engine
 * Consolidates with useAnalyticsData while preserving data transformation logic
 */
export function usePortfolioTrends({
  userId,
  days = 30,
  enabled = true,
}: UsePortfolioTrendsConfig = {}): UsePortfolioTrendsReturn {
  // Create a fetcher that includes the transformation logic
  const fetcherWithTransform = useCallback(async (uid: string, d: number) => {
    const trendResponse = await getPortfolioTrends(uid, d);
    return transformPortfolioTrends(trendResponse);
  }, []);

  const result = useAnalyticsData(fetcherWithTransform, {
    userId,
    days,
    enabled,
  });

  // Ensure data is always an array (not null) to match original return type
  return {
    ...result,
    data: result.data ?? [],
  };
}
