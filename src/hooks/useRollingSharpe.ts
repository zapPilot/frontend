import { useCallback, useEffect, useState } from "react";
import {
  getRollingSharpeAnalysis,
  RollingSharpeResponse,
} from "../services/analyticsService";
import { portfolioLogger } from "../utils/logger";

interface UseRollingSharpeConfig {
  userId?: string | undefined;
  days?: number;
  enabled?: boolean;
}

interface UseRollingSharpeReturn {
  data: RollingSharpeResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userId: string | null;
}

/**
 * Hook to fetch rolling Sharpe ratio analysis from analytics-engine
 *
 * ⚠️ Statistical Disclaimer: 30-day Sharpe ratios are directional indicators only.
 * Statistically robust analysis typically requires 90+ days of data.
 */
export function useRollingSharpe({
  userId,
  days = 40,
  enabled = true,
}: UseRollingSharpeConfig = {}): UseRollingSharpeReturn {
  const [data, setData] = useState<RollingSharpeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRollingSharpe = useCallback(async () => {
    if (!userId || !enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sharpeData = await getRollingSharpeAnalysis(userId, days);
      setData(sharpeData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch rolling Sharpe analysis";
      setError(errorMessage);
      portfolioLogger.error("Rolling Sharpe fetch error", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, days, enabled]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchRollingSharpe();
  }, [fetchRollingSharpe]);

  return {
    data,
    loading,
    error,
    refetch: fetchRollingSharpe,
    userId: userId || null,
  };
}
