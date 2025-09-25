import { useCallback, useEffect, useState } from "react";
import {
  getRollingVolatility,
  RollingVolatilityResponse,
} from "../services/analyticsService";
import { portfolioLogger } from "../utils/logger";

interface UseRollingVolatilityConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseRollingVolatilityReturn {
  data: RollingVolatilityResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch rolling volatility analysis from analytics-engine
 */
export function useRollingVolatility({
  userId,
  days = 40,
  enabled = true,
}: UseRollingVolatilityConfig = {}): UseRollingVolatilityReturn {
  const [data, setData] = useState<RollingVolatilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRollingVolatility = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const volatilityData = await getRollingVolatility(userId, days);
      setData(volatilityData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch rolling volatility";
      setError(errorMessage);
      portfolioLogger.error("Rolling volatility fetch error", err);
      setData(null); // Reset data on error
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchRollingVolatility();
  }, [fetchRollingVolatility]);

  return {
    data,
    loading,
    error,
    refetch: fetchRollingVolatility,
    userId: userId || null,
  };
}
