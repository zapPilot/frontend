import { useCallback, useEffect, useState } from "react";
import { getPortfolioTrends } from "../services/analyticsService";
import { PortfolioDataPoint } from "../types/portfolio";
import { portfolioLogger } from "../utils/logger";

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
 * Hook to fetch and transform portfolio trends from analytics-engine
 */
export function usePortfolioTrends({
  userId,
  days = 30,
  enabled = true,
}: UsePortfolioTrendsConfig = {}): UsePortfolioTrendsReturn {
  const [data, setData] = useState<PortfolioDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPortfolioTrends = useCallback(async () => {
    if (!userId || !enabled) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio trends directly with provided user ID
      const trendResponse = await getPortfolioTrends(userId, days);
      const dailyTotals = Array.isArray(trendResponse?.daily_totals)
        ? trendResponse.daily_totals
        : [];

      const normalizedData: PortfolioDataPoint[] = dailyTotals.map(
        dailyTotal => {
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
                  typeof protocol?.value_usd === "number"
                    ? protocol.value_usd
                    : 0,
                pnl:
                  typeof protocol?.pnl_usd === "number" ? protocol.pnl_usd : 0,
              }))
            : [];

          const dataPoint: PortfolioDataPoint = {
            date: dailyTotal.date,
            value: totalValue,
            change: changePercentage,
            benchmark: totalValue * 0.95,
            protocols,
          };

          if (typeof dailyTotal.chains_count === "number") {
            dataPoint.chainsCount = dailyTotal.chains_count;
          }

          return dataPoint;
        }
      );

      setData(normalizedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch portfolio trends";
      setError(errorMessage);
      portfolioLogger.error("Portfolio trends fetch error", err);
      setData([]); // Reset data on error
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchPortfolioTrends();
  }, [fetchPortfolioTrends]);

  return {
    data,
    loading,
    error,
    refetch: fetchPortfolioTrends,
    userId: userId || null,
  };
}
