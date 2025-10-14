import { useCallback, useEffect, useState } from "react";
import { portfolioLogger } from "../utils/logger";

interface UseAnalyticsDataConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseAnalyticsDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Generic hook for fetching analytics data from the analytics-engine
 *
 * @template T - The response data type
 * @param fetcher - Function that fetches the data: (userId: string, days: number) => Promise<T>
 * @param config - Configuration object with userId, days, and enabled flag
 * @returns Object containing data, loading state, error, refetch function, and userId
 *
 * @example
 * ```typescript
 * const { data, loading, error } = useAnalyticsData(
 *   getEnhancedDrawdown,
 *   { userId: "0x123", days: 30, enabled: true }
 * );
 * ```
 */
export function useAnalyticsData<T>(
  fetcher: (userId: string, days: number) => Promise<T>,
  config: UseAnalyticsDataConfig = {}
): UseAnalyticsDataReturn<T> {
  const { userId, days = 40, enabled = true } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(userId, days);
      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch analytics data";
      setError(errorMessage);
      portfolioLogger.error("Analytics data fetch error", err);
      setData(null); // Reset data on error
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled, fetcher]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    userId: userId || null,
  };
}
