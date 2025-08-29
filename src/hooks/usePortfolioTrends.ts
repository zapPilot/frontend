import { useCallback, useEffect, useState } from "react";
import {
  getPortfolioTrends,
  transformPortfolioTrends,
} from "../services/analyticsEngine";
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
      const trendsData = (await getPortfolioTrends(userId, days))?.trend_data;
      // Transform data for charts
      const transformedData = transformPortfolioTrends(
        Array.isArray(trendsData) ? trendsData : []
      );
      setData(transformedData);
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
